const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const fs = require('fs');
const papa = require('papaparse');

const app = express();
app.use(bodyParser.json());

const sequelize = new Sequelize('webapp', 'root', 'Pass1234', {
  host: 'localhost',
  dialect: 'mysql',
});

const saltRounds = 10;

const Account = sequelize.define('account', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  first_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  last_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  account_created: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  account_updated: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
});

const Assignment = sequelize.define('assignment', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  points: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  num_of_attempts: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  deadline: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  assignment_created: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  assignment_updated: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  creatorId: {
    type: Sequelize.UUID, // Assuming creatorId is a foreign key referencing Account table
    allowNull: false,
  },
});

// Load accounts from CSV after database synchronization

async function loadAccountsFromCSV() {
  try {
    const data = fs.readFileSync('C:\\Users\\akshi\\Downloads\\nodeapp\\user.csv', 'utf8');
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
    console.log('Accounts loaded successfully.');
  } catch (error) {
    console.error('Error loading accounts from CSV:', error);
  }
}


async function initializeDatabase() {
  try {
    await sequelize.sync();
    console.log('Database synchronized.');
    await loadAccountsFromCSV();
    
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  } catch (error) {
    console.error('Error initializing database:', error);
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
      console.log('Account not found for email:', email);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      console.log('Authentication failed for email:', email);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for account:', account.email);
    req.user = account;
    next(); // Call the next middleware or route handler
  } catch (error) {
    console.error('Error during authentication:', error);
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
  app.post('/v1/assignments', authenticateUser, async (req, res) => {
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // // GET endpoint to fetch assignment details by ID
  // app.get('/v1/assignments/:id', authenticateUser, async (req, res) => {
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
app.get('/v1/assignments', authenticateUser, async (req, res) => {
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

app.get('/v1/assignments/:id', authenticateUser, async (req, res) => {
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
  app.put('/v1/assignments/:id', authenticateUser, isAssignmentCreator, async (req, res) => {
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
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Bad Request' });
    }
  });

  
  
// DELETE endpoint to delete an assignment (only by the creator)
  app.delete('/v1/assignments/:id', authenticateUser, isAssignmentCreator, async (req, res) => {
    const { id } = req.params;
    try {
      const assignment = await Assignment.findByPk(id);
      if (assignment) {
        await assignment.destroy();
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
  app.get('/healthz', async (req, res) => {
    if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
      res.status(400).json({ error: 'Bad Request: Parameters or body not allowed' });
    } else {
      try {
        // Check database connection
        await sequelize.authenticate();
        console.log('Database connection successful.');
        // If the database connection is successful, return a 200 OK response
        res.status(200).send('OK');
      } catch (error) {
        // If there's a database connection issue, return a 503 status code
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
          console.error('Service unavailable:', error);
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          // For all other errors, return a 503 status code indicating service unavailability
          console.error('Health check failed:', error);
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
app.patch('/v1/assignments/:id', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});


  // sequelize.sync().then(() => {
  //   loadAccountsFromCSV();
  // });
  
  // app.listen(4000, () => {
  //   console.log('Server is running on port 4000');
  // });