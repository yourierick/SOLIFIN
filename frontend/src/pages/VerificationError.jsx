import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerificationError() {
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message');

    return (
        <div className="verification-error">
            <h2>Erreur de vérification</h2>
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary">
                Retour à la connexion
            </Link>
        </div>
    );
} 