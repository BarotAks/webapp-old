const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');
const sequelize = require('./config/database');
const Account = require('./models/account');
const Assignment = require('./models/assignment');
const logger = require('./logging');
const StatsD = require('node-statsd');
const Submission = require('./models/submission');
const { SNS } = require('aws-sdk'); // Import AWS SDK
const { Sequelize } = require('sequelize');

const app = express();
app.use(bodyParser.json());

const saltRounds = 10;

const statsd = new StatsD({
  host: 'localhost', 
  port: 8125, 
});

// // Middleware function to log requests
// app.use((req, res, next) => {
//   logger.info(`Incoming request: ${req.method} ${req.url}`);
//   next();
// });

// Load accounts from CSV after database synchronization

async function loadAccountsFromCSV() {
  try {
    const filePath = 'user.csv'; 
    const data = fs.readFileSync(filePath, 'utf8');
    const accountsData = papa.parse(data, {
      header: true,
      skipEmptyLines: true,
    }).data;

    for (const accountData of accountsData) {
      const { first_name, last_name, email, password } = accountData;

      if (first_name && last_name && email && password) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Check if the account with this email already exists
        const existingAccount = await Account.findOne({
          where: {
            email: email,
          },
        });

        if (existingAccount) {
          // Account with this email already exists, update the existing record
          existingAccount.first_name = first_name; // Update other fields as needed
          existingAccount.last_name = last_name;
          existingAccount.password = hashedPassword;
          await existingAccount.save();
          console.log(`Account ${email} updated.`);
        } else {
          // Account with this email does not exist, create a new record
          await Account.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
          });
          console.log(`Account ${email} created.`);
        }
      } else {
        console.log(`Invalid data: ${JSON.stringify(accountData)}`);
      }
    }
    logger.info('Accounts loaded successfully.');
  } catch (error) {
    logger.error('Error loading accounts from CSV:', error);
  }
}


const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

async function initializeDatabase() {
  try {
    await sequelize.sync();
    logger.info('Database synchronized.');
    await loadAccountsFromCSV();
    
    const port = process.env.PORT || 3000; // Default to port 3000 if PORT is not specified in .env
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Error initializing database:', error);
  }
}


initializeDatabase(); // Call the function to initialize the database


async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('Received Authorization Header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [, token] = authHeader.split(' ');
  console.log('Extracted Token:', token);

  const decoded = Buffer.from(token, 'base64').toString('utf-8').split(':');
  console.log('Decoded Credentials:', decoded);

  const email = decoded[0];
  const password = decoded[1];

  try {
    const account = await Account.findOne({
      where: {
        email: email,
      },
    });

    if (!account) {
      logger.info('Account not found for email:', email);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      logger.info('Authentication failed for email:', email);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Authentication successful for account:', account.email);
    req.user = account;
    next(); // Call the next middleware or route handler
  } catch (error) {
    logger.error('Error during authentication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}



async function isAssignmentCreator(req, res, next) {
  const assignmentId = req.params.id;
  const userId = req.user.id;
  try {
    const assignment = await Assignment.findByPk(assignmentId);
    if (assignment && assignment.creatorId === userId) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
  
  // POST endpoint to create an assignment
  app.post('/v2/assignments', authenticateUser, async (req, res) => {
    const { name, points, num_of_attempts, deadline } = req.body;
  
    if (!name || !points || !num_of_attempts || !deadline) {
      return res.status(400).json({ error: 'Bad Request' });
    }
  
    const userId = req.user.id;
  
    try {
      // Create assignment only if user is authenticated
      const assignment = await Assignment.create({
        name,
        points,
        num_of_attempts,
        deadline,
        assignment_created: new Date(),
        assignment_updated: new Date(),
        creatorId: userId,
      });
  
      res.status(201).json({
        id: assignment.id,
        name: assignment.name,
        points: assignment.points,
        num_of_attempts: assignment.num_of_attempts,
        deadline: assignment.deadline,
        assignment_created: assignment.assignment_created,
        assignment_updated: assignment.assignment_updated,
      });
      // Increment custom metric for create assignment API call count
      statsd.increment('api_create_assignment_count');
      statsd.send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // // GET endpoint to fetch assignment details by ID
  // app.get('/v2/assignments/:id', authenticateUser, async (req, res) => {
  //   const { id } = req.params;
    
  //   try {
  //     // Find the assignment by ID and ensure the logged-in user is the creator
  //     const assignment = await Assignment.findOne({
  //       where: {
  //         id,
  //         creatorId: req.user.id,
  //       },
  //     });

  //     if (assignment) {
  //       res.status(200).json({
  //         id: assignment.id,
  //         name: assignment.name,
  //         points: assignment.points,
  //         num_of_attempts: assignment.num_of_attempts,
  //         deadline: assignment.deadline,
  //         assignment_created: assignment.assignment_created,
  //         assignment_updated: assignment.assignment_updated,
  //       });
  //     } else {
  //       res.status(404).json({ error: 'Not Found' });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });

  // GET endpoint to fetch assignments created by the logged-in user
app.get('/v2/assignments', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // Find all assignments created by the logged-in user
    const assignments = await Assignment.findAll({
      where: {
        creatorId: userId,
      },
    });

    if (assignments.length > 0) {
      // If assignments are found, return them
      const formattedAssignments = assignments.map((assignment) => ({
        id: assignment.id,
        name: assignment.name,
        points: assignment.points,
        num_of_attempts: assignment.num_of_attempts,
        deadline: assignment.deadline,
        assignment_created: assignment.assignment_created,
        assignment_updated: assignment.assignment_updated,
      }));
      res.status(200).json(formattedAssignments);
      // Increment custom metric for fetch assignments API call count
      statsd.increment('api_fetch_assignments_count');
      statsd.send();
    } else {
      // If no assignments are found, return a 404 Not Found response
      res.status(404).json({ error: 'No Assignments Found' });
    }
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/v2/assignments/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Find the assignment by ID and ensure it was created by the logged-in user
    const assignment = await Assignment.findOne({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (assignment) {
      // If assignment is found, return it
      const formattedAssignment = {
        id: assignment.id,
        name: assignment.name,
        points: assignment.points,
        num_of_attempts: assignment.num_of_attempts,
        deadline: assignment.deadline,
        assignment_created: assignment.assignment_created,
        assignment_updated: assignment.assignment_updated,
      };
      res.status(200).json(formattedAssignment);
      // Increment custom metric for fetch assignments API call count
      statsd.increment('api_fetch_assignments_count');
      statsd.send();
    } else {
      // If no assignment is found, return a 404 Not Found response
      res.status(404).json({ error: 'Assignment Not Found' });
    }
  } catch (error) {
    // Handle any errors that occur during the database query
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  
  
  // PUT endpoint to update an assignment (only by the creator)
  app.put('/v2/assignments/:id', authenticateUser, isAssignmentCreator, async (req, res) => {
    const { id } = req.params;
    try {
      const { name, points, num_of_attempts, deadline } = req.body;
      const assignment = await Assignment.findByPk(id);
      if (assignment) {
        await assignment.update({
          name,
          points,
          num_of_attempts,
          deadline,
          assignment_updated: new Date(),
        });
        res.status(204).send();

        // Increment custom metric for update assignment API call count
        statsd.increment('api_update_assignment_count');
        statsd.send();
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Bad Request' });
    }
  });

  
  
// DELETE endpoint to delete an assignment (only by the creator)
  app.delete('/v2/assignments/:id', authenticateUser, isAssignmentCreator, async (req, res) => {
    const { id } = req.params;
    try {
      const assignment = await Assignment.findByPk(id);
      if (assignment) {
        await assignment.destroy();
        res.status(204).send();
       // Increment custom metric for delete assignment API call count
        statsd.increment('api_delete_assignment_count');
        statsd.send();
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  const sns = new SNS();

  // POST endpoint to create a submission
  app.post('/v2/assignments/:id/submission', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { submission_url } = req.body;
  
    if (!submission_url) {
      return res.status(400).json({ error: 'Bad Request' });
    }
  
    try {
      // Check if the assignment exists and the user is the creator
      const assignment = await Assignment.findByPk(id);
      if (!assignment || assignment.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
  
      // Check if the user has exceeded the number of allowed attempts (retries)
      const numAttempts = assignment.num_of_attempts || 1; // Default to 1 if not specified
      const existingSubmissions = await Submission.count({
        where: {
          assignment_id: id,
          submission_date: {
            [Sequelize.Op.gt]: new Date(new Date() - assignment.deadline * 60000),
          },
        },
      });
  
      if (existingSubmissions >= numAttempts) {
        return res.status(403).json({ error: 'Exceeded Maximum Number of Attempts' });
      }
  
      // Check if the assignment's deadline has passed
      if (new Date() > new Date(assignment.deadline)) {
        return res.status(403).json({ error: 'Assignment Deadline Passed' });
      }
  
      // Create submission
      const submission = await Submission.create({
        assignment_id: id,
        submission_url,
        submission_date: new Date(),
        submission_updated: new Date(),
      });
  
      // Post the URL to the SNS topic along with user info
      const snsMessage = {
        email: req.user.email,
        assignment_id: submission.assignment_id,
        submission_url: submission.submission_url,
      };
  
      const snsParams = {
        Message: JSON.stringify(snsMessage),
        TopicArn: process.env.SNS_TOPIC_ARN, // Replace with your SNS topic ARN
      };
  
      await sns.publish(snsParams).promise();
  
      // Increment custom metric for create submission API call count
      statsd.increment('api_create_submission_count');
      statsd.send();
  
      // Send response
      res.status(201).json({
        id: submission.id,
        assignment_id: submission.assignment_id,
        submission_url: submission.submission_url,
        submission_date: submission.submission_date,
        submission_updated: submission.submission_updated,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });  
  

// Middleware function to log errors
  app.use((err, req, res, next) => {
    logger.error(`Error occurred: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  });  
  
  app.get('/healthz', async (req, res) => {
    if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
      res.status(400).json({ error: 'Bad Request: Parameters or body not allowed' });
    } else {
      try {
        // Check database connection
        await sequelize.authenticate();
        logger.info('Database connection successful.');
        // If the database connection is successful, return a 200 OK response
        res.status(200).send('OK');

        // Increment custom metric for health check API call count
        statsd.increment('api_health_check_count');
        statsd.send();
      } catch (error) {
        // If there's a database connection issue, return a 503 status code
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
          logger.error('Service unavailable:', error);
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          // For all other errors, return a 503 status code indicating service unavailability
          logger.error('Health check failed:', error);
          res.status(503).json({ error: 'Service Unavailable' });
        }
      }
    }
  });
  
  

  
// Catch unsupported HTTP methods
app.use((req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});


// PATCH endpoint to update assignments
app.patch('/v2/assignments/:id', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

module.exports = app; // Export the Express app instance

  // sequelize.sync().then(() => {
  //   loadAccountsFromCSV();
  // });
  
  // app.listen(4000, () => {
  //   console.log('Server is running on port 4000');
  // });