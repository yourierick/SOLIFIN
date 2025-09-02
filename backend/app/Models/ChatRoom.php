<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatRoom extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'user_one_id',
        'user_two_id',
    ];

    /**
     * Obtenir les messages associés à cette conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    /**
     * Obtenir le premier utilisateur de la conversation.
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * Obtenir le deuxième utilisateur de la conversation.
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Vérifier si un utilisateur est membre de cette conversation.
     */
    public function hasMember(int $userId): bool
    {
        return $userId == $this->user_one_id || $userId == $this->user_two_id;
    }
    
    /**
     * Obtenir l'autre utilisateur de la conversation par rapport à l'utilisateur donné.
     */
    public function getOtherUser(int $userId): ?User
    {
        if ($userId == $this->user_one_id) {
            return $this->userTwo;
        } elseif ($userId == $this->user_two_id) {
            return $this->userOne;
        }
        
        return null;
    }
    
    /**
     * Obtenir le nombre de messages non lus pour un utilisateur.
     */
    public function getUnreadCount(int $userId): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
    }
}
