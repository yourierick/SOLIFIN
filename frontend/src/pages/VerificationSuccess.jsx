import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerificationSuccess() {
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message');

    return (
        <div className="verification-success">
            <h2>Vérification réussie</h2>
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary">
                Se connecter
            </Link>
        </div>
    );
} 