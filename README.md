# webapp

# Web Application Development

This repository contains a web application built with Express.js and Sequelize, a Node.js ORM, for managing assignments and user accounts.

## Prerequisites

- Node.js installed
- MySQL database server

## Getting Started

1. **Clone the repository to your local machine:**

    ```bash
    git clone https://github.com/your-username/web-app.git
    cd web-app
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Configure the database connection in `index.js`. Modify the Sequelize connection parameters according to your MySQL database setup:**

    ```javascript
    const sequelize = new Sequelize('dbname', 'dbuser', 'dbpassword', {
      host: 'hostname',
      dialect: 'mysql',
    });
    ```

4. **Ensure you have a CSV file named `user.csv` in the project directory with the following format:**

    ```csv
    first_name,last_name,email,password
    John,Doe,john.doe@example.com,password123
    ```

5. **Run the application:**

    ```bash
    node index.js
    ```

6. **The server will start running on port 4000. You can access the API at `http://localhost:4000`.**

## API Endpoints

### Create Assignment

- **Endpoint:** `POST /v1/assignments`
- **Body:**

    ```json
    {
      "name": "Assignment 01",
      "points": 10,
      "num_of_attempts": 3,
      "deadline": "2023-10-31T23:59:59Z"
    }
    ```

- **Description:** Create a new assignment. Requires authentication.

### Get Assignments

- **Endpoint:** `GET /v1/assignments`
- **Description:** Retrieve assignments created by the authenticated user.

### Get Assignment by ID

- **Endpoint:** `GET /v1/assignments/:id`
- **Description:** Retrieve a specific assignment by its ID if the user is the creator.

### Update Assignment

- **Endpoint:** `PUT /v1/assignments/:id`
- **Body:**

    ```json
    {
      "name": "Assignment 01",
      "points": 5,
      "num_of_attempts": 10,
      "deadline": "2022-10-31T23:59:59Z"
    }
    ```

- **Description:** Update an assignment if the user is the creator.

### Delete Assignment

- **Endpoint:** `DELETE /v1/assignments/:id`
- **Description:** Delete an assignment if the user is the creator.

### Health Check

- **Endpoint:** `GET /healthz`
- **Description:** Check the health of the application. No parameters or body allowed.
