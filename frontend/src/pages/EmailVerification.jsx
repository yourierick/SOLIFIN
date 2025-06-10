import React from 'react';

export default function EmailVerification() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Vérification de votre email en cours...</p>
            </div>
        </div>
    );
}
