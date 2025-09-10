<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastMessage extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'type',
        'media_url',
        'status',
        'published_at',
    ];

    /**
     * Les attributs qui doivent être castés.
     *
     * @var array
     */
    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Les utilisateurs qui ont vu ce message.
     */
    public function viewers()
    {
        return $this->belongsToMany(User::class, 'broadcast_message_user')
            ->withPivot('seen_at')
            ->withTimestamps();
    }

    /**
     * Vérifie si un utilisateur a déjà vu ce message.
     *
     * @param int $userId
     * @return bool
     */
    public function isSeenByUser($userId)
    {
        return $this->viewers()->where('user_id', $userId)->exists();
    }

    /**
     * Marque ce message comme vu par un utilisateur.
     *
     * @param int $userId
     * @return void
     */
    public function markAsSeenByUser($userId)
    {
        if (!$this->isSeenByUser($userId)) {
            $this->viewers()->attach($userId, [
                'seen_at' => now(),
            ]);
        }
    }

    /**
     * Relance ce message pour qu'il soit à nouveau visible.
     *
     * @return void
     */
    public function republish()
    {
        // Supprimer toutes les entrées de visualisation pour ce message
        $this->viewers()->detach();
        
        // Republier le message
        $this->update([
            'status' => true,
            'published_at' => now(),
        ]);
    }

    /**
     * Scope pour les messages publiés.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublished($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope pour les messages non vus par un utilisateur spécifique.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeNotSeenByUser($query, $userId)
    {
        return $query->whereDoesntHave('viewers', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        });
    }
}
