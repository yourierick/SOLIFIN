<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Définition des tâches planifiées pour Laravel 11
Schedule::command('packs:check-expiration')
    ->daily()
    ->at('00:00')
    ->appendOutputTo(storage_path('logs/expired-packs.log'))
    ->description('Vérifie les packs expirés tous les jours à minuit');

Schedule::command('publications:update-status')
    ->daily()
    ->at('00:30')
    ->appendOutputTo(storage_path('logs/publications-status.log'))
    ->description('Met à jour le statut des publications expirées tous les jours à 00h30');

// Schedule::command('transaction-fees:update')
//     ->daily()
//     ->at('01:00')
//     ->appendOutputTo(storage_path('logs/transaction-fees.log'))
//     ->description('Met à jour les frais de transaction depuis l\'API externe tous les jours à 1h du matin');

Schedule::command('app:delete-expired-social-events')
    ->hourly()
    ->appendOutputTo(storage_path('logs/expired-social-events.log'))
    ->description('Supprime les statuts sociaux de plus de 24 heures');

Schedule::command('exchange:update')
    ->daily()
    ->at('01:30')
    ->appendOutputTo(storage_path('logs/exchange-rates.log'))
    ->description('Met à jour les taux de change des devises depuis une API externe tous les jours à 1h30 du matin');

// Jetons Esengo (mensuel - le premier jour de chaque mois à 00:45)
Schedule::command('solifin:process-bonus-points monthly')
    ->monthlyOn(1, '00:45')
    ->appendOutputTo(storage_path('logs/bonus-points-esengo.log'))
    ->description('Attribue les jetons Esengo (mensuels) aux utilisateurs');

// Vérification des jetons Esengo expirés (tous les jours à 01:15)
Schedule::command('solifin:check-expired-jetons-esengo')
    ->daily()
    ->at('01:15')
    ->appendOutputTo(storage_path('logs/expired-jetons-esengo.log'))
    ->description('Vérifie et marque les jetons Esengo expirés');
    
// Vérification des tickets gagnants expirés (tous les jours à 01:45)
Schedule::command('solifin:check-expired-tickets-gagnants --notify')
    ->daily()
    ->at('01:45')
    ->appendOutputTo(storage_path('logs/expired-tickets-gagnants.log'))
    ->description('Vérifie et marque les tickets gagnants expirés');

// Planification du traitement des invitations à témoigner
// Vérification quotidienne des utilisateurs éligibles (tous les jours à 02:00)
Schedule::command('testimonials:process-prompts --expire')
    ->dailyAt('00:15')
    ->appendOutputTo(storage_path('logs/testimonial-prompts.log'))
    ->description('Vérifie les utilisateurs éligibles et crée des invitations à témoigner');

// Vérification hebdomadaire plus approfondie (chaque dimanche à 03:00)
Schedule::command('testimonials:process-prompts --batch=500 --expire')
    ->weeklyOn(0, '03:00') // 0 = Dimanche
    ->appendOutputTo(storage_path('logs/testimonial-prompts-weekly.log'))
    ->description('Vérification hebdomadaire approfondie des invitations à témoigner');
