## DataFlow-Manager

DataFlow-Manager is a modern, responsive web application designed to allow users to upload, analyze, clean, filter, and export CSV and Excel datasets efficiently.

## Features

File Upload & History: Support for .csv, .xlsx, and .xls files with a clean session history management.

Data Analysis: Instant statistical overview including total rows, total columns, missing values count, and duplicate rows detection.

Data Cleaning: Built-in tools to remove duplicate rows, handle missing values, and fill empty cells dynamically.

Data Filtering & Export: Advanced filtering capabilities and data exporting options.

## Tech Stack & Architecture

This project follows a clean separation of concerns between the frontend interface and the FastAPI backend:

## Frontend:

HTML5 & CSS3 (Modern, spacious, borderless responsive layout).

JavaScript (Vanilla JS for DOM manipulation, asynchronous API requests, and dynamic UI rendering).

## Backend:

FastAPI (High-performance Python web framework).

main.py: The main entry point that initializes the FastAPI app, manages middleware, and mounts static files/routers.

Routers: Handle endpoint routing for file uploads, data processing, and analysis.

Services: Encapsulate the core business logic for data cleaning, parsing, and dataframe manipulations using Pandas.

## How to Run the Project Locally

If you encounter issues running the server or want to ensure a clean startup, follow these exact terminal commands step by step:

Open your project folder in Visual Studio Code (make sure your terminal is pointing to the root directory DataFlow-Manager).

## Activate the Virtual Environment:

On Windows (PowerShell/Command Prompt):

.\venv\Scripts\activate


Check: You should see (venv) appearing at the beginning of your terminal line.

Run the FastAPI Backend Server:
Execute the following command to start Uvicorn with auto-reload:

uvicorn backend.app.main:app --reload


## Access the Application:

Open your browser and go to the local server URL provided in the terminal (usually http://127.0.0.1:8000).

You can access the frontend interface directly through the static mount or your configured path.

