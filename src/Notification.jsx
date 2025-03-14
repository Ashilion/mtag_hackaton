// Simple notification component instead of toast
import React, {useEffect} from "react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.jsx";
import {AlertCircle} from "lucide-react";

export const Notification = ({message, type, onClose}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto close after 4 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <Alert className={`mb-2 ${type === 'error' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
            <AlertCircle className={`h-4 w-4 ${type === 'error' ? 'text-red-500' : 'text-green-500'}`}/>
            <AlertTitle className={type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {type === 'error' ? 'Error' : 'Success'}
            </AlertTitle>
            <AlertDescription>
                {message}
            </AlertDescription>
        </Alert>
    );
};