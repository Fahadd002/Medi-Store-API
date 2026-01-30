import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

interface CustomError extends Error {
    statusCode?: number;
    code?: string | number;
    meta?: {
        target?: string[] | string;
        cause?: string;
        [key: string]: any;
    };
    keyValue?: Record<string, any>;
    path?: string;
    value?: any;
    errors?: any;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    let errorDetails: any = {
        message: err.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };

    console.error("Error:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });

    // Check error message first for custom business logic errors
    if (err.message) {
        const message = err.message.toLowerCase();
        
        // Authorization errors
        if (message.includes("unauthorized") || message.includes("not authorized")) {
            statusCode = 401;
            errorMessage = err.message;
        }
        // Permission/Forbidden errors
        else if (message.includes("not owner") || 
                 message.includes("not the owner") || 
                 message.includes("permission denied") ||
                 message.includes("forbidden") ||
                 message.includes("not allowed")) {
            statusCode = 403;
            errorMessage = err.message;
        }
        // Not found errors
        else if (message.includes("not found") || 
                 message.includes("not exist") || 
                 message.includes("does not exist") ||
                 message.includes("no such")) {
            statusCode = 404;
            errorMessage = err.message;
        }
        // Validation/required errors
        else if (message.includes("required") || 
                 message.includes("invalid") || 
                 message.includes("validation")) {
            statusCode = 400;
            errorMessage = err.message;
        }
        // Conflict errors
        else if (message.includes("already exists") || 
                 message.includes("already been") ||
                 message.includes("duplicate")) {
            statusCode = 409;
            errorMessage = err.message;
        }
        // Rate limiting/timeout errors
        else if (message.includes("timeout") || message.includes("rate limit")) {
            statusCode = 429;
            errorMessage = err.message;
        }
    }

    // Prisma Errors (only if not already handled by message above)
    if (statusCode === 500 && err instanceof Prisma.PrismaClientKnownRequestError) {
        statusCode = 400;
        
        switch (err.code) {
            case 'P2000':
                errorMessage = "The provided value is too long for the field";
                break;
            case 'P2002':
                const targetField = Array.isArray(err.meta?.target) && err.meta.target.length > 0 
                    ? err.meta.target[0] 
                    : typeof err.meta?.target === 'string'
                    ? err.meta.target
                    : 'unknown field';
                errorMessage = `Duplicate field value: ${targetField}`;
                errorDetails.field = targetField;
                break;
            case 'P2003':
                errorMessage = "Foreign key constraint failed";
                break;
            case 'P2025':
                statusCode = 404;
                errorMessage = "Record not found";
                break;
            case 'P2016':
                errorMessage = "Invalid data format";
                break;
            case 'P2001':
                statusCode = 404;
                errorMessage = "Record not found in database";
                break;
            default:
                errorMessage = "Database operation failed";
        }
        
        errorDetails.code = err.code;
        errorDetails.meta = err.meta;
    }
    
    // Prisma Validation Error
    else if (statusCode === 500 && err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorMessage = "Validation error: Incorrect field type or missing fields";
        errorDetails.type = "Validation Error";
    }
    
    // Prisma Initialization Error
    else if (statusCode === 500 && err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 500;
        errorMessage = "Database connection failed";
        errorDetails.type = "Database Connection Error";
    }
    
    // Prisma Unknown Request Error
    else if (statusCode === 500 && err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = 500;
        errorMessage = "Unknown database error";
        errorDetails.type = "Unknown Database Error";
    }
    
    // Prisma RUST panic error
    else if (statusCode === 500 && err instanceof Prisma.PrismaClientRustPanicError) {
        statusCode = 500;
        errorMessage = "Database system error";
        errorDetails.type = "Database System Error";
    }
    
    // Custom thrown errors with statusCode
    else if (statusCode === 500 && err.statusCode) {
        statusCode = err.statusCode;
        errorMessage = err.message;
    }
    
    // JWT/Authorization errors
    else if (statusCode === 500 && err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorMessage = "Invalid token";
    }
    else if (statusCode === 500 && err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorMessage = "Token expired";
    }
    
    // Validation errors (like from Joi, Zod, etc.)
    else if (statusCode === 500 && err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = "Validation failed";
        errorDetails.errors = err.errors || err.message;
    }
    
    // Cast errors (like MongoDB ObjectId cast)
    else if (statusCode === 500 && err.name === 'CastError') {
        statusCode = 400;
        errorMessage = "Invalid ID format";
        errorDetails.path = err.path;
        errorDetails.value = err.value;
    }
    
    // Duplicate key error
    else if (statusCode === 500 && (err.code === '11000' || err.code === '23505')) {
        statusCode = 409;
        errorMessage = "Duplicate entry found";
        errorDetails.field = err.keyValue || (err.meta?.target && Array.isArray(err.meta.target) ? err.meta.target[0] : undefined);
    }
    
    // Syntax errors
    else if (statusCode === 500 && err instanceof SyntaxError) {
        statusCode = 400;
        errorMessage = "Invalid JSON syntax";
    }
    
    // Type errors
    else if (statusCode === 500 && err instanceof TypeError) {
        statusCode = 400;
        errorMessage = "Type error in request";
    }

    // Build the response object
    const response: any = {
        success: false,
        message: errorMessage,
        error: {
            name: err.name,
            details: errorDetails
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

export default errorHandler;