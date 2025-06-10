import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  DragIndicator as DragIndicatorIcon,
  Save as SaveIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const QuizEditor = ({ initialContent, onChange, readOnly }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [quizContent, setQuizContent] = useState({
    title: "",
    description: "",
    questions: [],
  });

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Initialiser le contenu du quiz
  useEffect(() => {
    if (initialContent) {
      try {
        const content =
          typeof initialContent === "string"
            ? JSON.parse(initialContent)
            : initialContent;

        setQuizContent({
          title: content.title || "",
          description: content.description || "",
          questions: Array.isArray(content.questions) ? content.questions : [],
        });
      } catch (e) {
        console.error("Erreur lors de l'analyse du contenu initial:", e);
        setQuizContent({
          title: "",
          description: "",
          questions: [],
        });
      }
    }
  }, [initialContent]);

  // Notifier le composant parent des changements
  // Utiliser une référence pour suivre si le contenu a réellement changé
  const prevContentRef = React.useRef(JSON.stringify(quizContent));
  
  useEffect(() => {
    const currentContent = JSON.stringify(quizContent);
    
    // Ne notifier le parent que si le contenu a réellement changé
    // et si ce n'est pas la première initialisation depuis initialContent
    if (onChange && typeof onChange === "function" && 
        prevContentRef.current !== currentContent && 
        quizContent.questions.length > 0) {
      prevContentRef.current = currentContent;
      onChange(currentContent);
    }
  }, [quizContent, onChange]);

  // Mettre à jour le titre du quiz
  const handleTitleChange = (e) => {
    setQuizContent((prev) => ({
      ...prev,
      title: e.target.value,
    }));
  };

  // Mettre à jour la description du quiz
  const handleDescriptionChange = (e) => {
    setQuizContent((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  // Ajouter une nouvelle question
  const handleAddQuestion = () => {
    setEditingQuestion({
      id: `q${Date.now()}`,
      text: "",
      type: "single",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correctAnswers: [],
      explanation: "",
    });
    setShowQuestionDialog(true);
  };

  // Éditer une question existante
  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setShowQuestionDialog(true);
  };

  // Supprimer une question
  const handleDeleteQuestion = (questionId) => {
    setQuizContent((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  // Mettre à jour le texte de la question en cours d'édition
  const handleQuestionTextChange = (e) => {
    setEditingQuestion((prev) => ({
      ...prev,
      text: e.target.value,
    }));
  };

  // Mettre à jour le type de la question en cours d'édition
  const handleQuestionTypeChange = (e) => {
    setEditingQuestion((prev) => ({
      ...prev,
      type: e.target.value,
      correctAnswers: [], // Réinitialiser les réponses correctes
    }));
  };

  // Mettre à jour l'explication de la question en cours d'édition
  const handleExplanationChange = (e) => {
    setEditingQuestion((prev) => ({
      ...prev,
      explanation: e.target.value,
    }));
  };

  // Mettre à jour le texte d'une option
  const handleOptionTextChange = (optionId, value) => {
    setEditingQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, text: value } : opt
      ),
    }));
  };

  // Ajouter une nouvelle option
  const handleAddOption = () => {
    if (editingQuestion.options.length >= 8) {
      return; // Limiter à 8 options maximum
    }

    // Générer un nouvel ID pour l'option
    const optionIds = "abcdefghijklmnopqrstuvwxyz";
    const usedIds = editingQuestion.options.map((opt) => opt.id);
    let newId = "";

    for (let i = 0; i < optionIds.length; i++) {
      if (!usedIds.includes(optionIds[i])) {
        newId = optionIds[i];
        break;
      }
    }

    if (!newId) {
      newId = `opt${Date.now()}`;
    }

    setEditingQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { id: newId, text: "" }],
    }));
  };

  // Supprimer une option
  const handleDeleteOption = (optionId) => {
    // Vérifier qu'il reste au moins 2 options
    if (editingQuestion.options.length <= 2) {
      return;
    }

    setEditingQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== optionId),
      correctAnswers: prev.correctAnswers.filter((id) => id !== optionId),
    }));
  };

  // Gérer la sélection des réponses correctes
  const handleCorrectAnswerChange = (optionId, isChecked) => {
    setEditingQuestion((prev) => {
      if (prev.type === "single") {
        // Pour les questions à choix unique, remplacer la réponse
        return {
          ...prev,
          correctAnswers: [optionId],
        };
      } else {
        // Pour les questions à choix multiples, ajouter ou supprimer
        if (isChecked) {
          return {
            ...prev,
            correctAnswers: [...prev.correctAnswers, optionId],
          };
        } else {
          return {
            ...prev,
            correctAnswers: prev.correctAnswers.filter((id) => id !== optionId),
          };
        }
      }
    });
  };

  // Sauvegarder la question en cours d'édition
  const handleSaveQuestion = () => {
    // Validation de base
    if (!editingQuestion.text.trim()) {
      alert("Veuillez saisir le texte de la question");
      return;
    }

    if (editingQuestion.options.some((opt) => !opt.text.trim())) {
      alert("Veuillez remplir toutes les options");
      return;
    }

    if (editingQuestion.correctAnswers.length === 0) {
      alert("Veuillez sélectionner au moins une réponse correcte");
      return;
    }

    // Ajouter ou mettre à jour la question
    setQuizContent((prev) => {
      const existingIndex = prev.questions.findIndex(
        (q) => q.id === editingQuestion.id
      );

      if (existingIndex >= 0) {
        // Mettre à jour une question existante
        const updatedQuestions = [...prev.questions];
        updatedQuestions[existingIndex] = { ...editingQuestion };
        return {
          ...prev,
          questions: updatedQuestions,
        };
      } else {
        // Ajouter une nouvelle question
        return {
          ...prev,
          questions: [...prev.questions, { ...editingQuestion }],
        };
      }
    });

    // Fermer le dialogue
    setShowQuestionDialog(false);
    setEditingQuestion(null);
  };

  // Gérer le glisser-déposer des questions
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(quizContent.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuizContent((prev) => ({
      ...prev,
      questions: items,
    }));
  };

  // Afficher le dialogue d'aide
  const renderHelpDialog = () => (
    <Dialog
      open={helpDialogOpen}
      onClose={() => setHelpDialogOpen(false)}
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          backend: isDarkMode ? "#1f2937" : "#fff",
        },
      }}
    >
      <DialogTitle>Guide de création de quiz</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Structure d'un quiz
        </Typography>
        <Typography paragraph>
          Un quiz est composé d'un titre, d'une description et d'une série de
          questions. Chaque question peut être à choix unique ou à choix
          multiples.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Types de questions
        </Typography>
        <Typography paragraph>
          <strong>Choix unique :</strong> L'utilisateur doit sélectionner une
          seule réponse. Vous devez définir quelle option est la réponse
          correcte.
        </Typography>
        <Typography paragraph>
          <strong>Choix multiples :</strong> L'utilisateur peut sélectionner
          plusieurs réponses. Vous devez définir quelles options sont les
          réponses correctes.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Bonnes pratiques
        </Typography>
        <Typography component="div">
          <ul>
            <li>Rédigez des questions claires et précises</li>
            <li>Proposez des options de réponse plausibles</li>
            <li>Ajoutez une explication pour chaque question</li>
            <li>Variez les types de questions</li>
            <li>Limitez le nombre de questions (5-10 est idéal)</li>
          </ul>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setHelpDialogOpen(false)}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );

  // Afficher le dialogue d'édition de question
  const renderQuestionDialog = () => (
    <Dialog
      open={showQuestionDialog}
      onClose={() => setShowQuestionDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
        },
      }}
    >
      <DialogTitle>
        {editingQuestion && editingQuestion.id
          ? "Modifier la question"
          : "Ajouter une question"}
      </DialogTitle>
      <DialogContent dividers>
        {editingQuestion && (
          <>
            <TextField
              label="Question"
              value={editingQuestion.text}
              onChange={handleQuestionTextChange}
              fullWidth
              margin="normal"
              required
            />

            <FormControl component="fieldset" margin="normal">
              <Typography variant="subtitle2" gutterBottom>
                Type de question
              </Typography>
              <RadioGroup
                row
                value={editingQuestion.type}
                onChange={handleQuestionTypeChange}
              >
                <FormControlLabel
                  value="single"
                  control={<Radio />}
                  label="Choix unique"
                />
                <FormControlLabel
                  value="multiple"
                  control={<Radio />}
                  label="Choix multiples"
                />
              </RadioGroup>
            </FormControl>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Options de réponse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingQuestion.type === "single"
                  ? "Sélectionnez une seule réponse correcte"
                  : "Sélectionnez une ou plusieurs réponses correctes"}
              </Typography>

              {editingQuestion.options.map((option, index) => (
                <Box
                  key={option.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.02)",
                  }}
                >
                  {editingQuestion.type === "single" ? (
                    <Radio
                      checked={editingQuestion.correctAnswers.includes(
                        option.id
                      )}
                      onChange={(e) =>
                        handleCorrectAnswerChange(option.id, e.target.checked)
                      }
                      color="success"
                    />
                  ) : (
                    <Checkbox
                      checked={editingQuestion.correctAnswers.includes(
                        option.id
                      )}
                      onChange={(e) =>
                        handleCorrectAnswerChange(option.id, e.target.checked)
                      }
                      color="success"
                    />
                  )}

                  <TextField
                    value={option.text}
                    onChange={(e) =>
                      handleOptionTextChange(option.id, e.target.value)
                    }
                    fullWidth
                    placeholder={`Option ${index + 1}`}
                    size="small"
                    sx={{ mx: 1 }}
                  />

                  <IconButton
                    onClick={() => handleDeleteOption(option.id)}
                    disabled={editingQuestion.options.length <= 2}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                disabled={editingQuestion.options.length >= 8}
                sx={{ mt: 1 }}
                size="small"
              >
                Ajouter une option
              </Button>
            </Box>

            <TextField
              label="Explication (affichée après la soumission)"
              value={editingQuestion.explanation}
              onChange={handleExplanationChange}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder="Expliquez pourquoi la/les réponse(s) est/sont correcte(s)"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowQuestionDialog(false)}>Annuler</Button>
        <Button
          onClick={handleSaveQuestion}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {renderHelpDialog()}
      {renderQuestionDialog()}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Éditeur de Quiz</Typography>
          <Tooltip title="Aide pour créer un quiz">
            <IconButton
              onClick={() => setHelpDialogOpen(true)}
              color="primary"
              size="small"
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TextField
          label="Titre du quiz"
          value={quizContent.title}
          onChange={handleTitleChange}
          fullWidth
          margin="normal"
          disabled={readOnly}
        />

        <TextField
          label="Description"
          value={quizContent.description}
          onChange={handleDescriptionChange}
          fullWidth
          margin="normal"
          multiline
          rows={2}
          disabled={readOnly}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">
            Questions ({quizContent.questions.length})
          </Typography>
          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
              size="small"
            >
              Ajouter une question
            </Button>
          )}
        </Box>

        {quizContent.questions.length === 0 ? (
          <Alert severity="info">
            Aucune question n'a été ajoutée. Utilisez le bouton "Ajouter une
            question" pour commencer.
          </Alert>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {quizContent.questions.map((question, index) => (
                    <Draggable
                      key={question.id}
                      draggableId={question.id}
                      index={index}
                      isDragDisabled={readOnly}
                    >
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: isDarkMode ? "#1f2937" : "#fff",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {!readOnly && (
                                <Box
                                  {...provided.dragHandleProps}
                                  sx={{ mr: 1, cursor: "grab" }}
                                >
                                  <DragIndicatorIcon color="action" />
                                </Box>
                              )}
                              <Box>
                                <Typography variant="subtitle1">
                                  {index + 1}. {question.text}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {question.type === "single"
                                    ? "Choix unique"
                                    : "Choix multiples"}{" "}
                                  • {question.options.length} options
                                </Typography>
                              </Box>
                            </Box>

                            {!readOnly && (
                              <Box>
                                <IconButton
                                  onClick={() => handleEditQuestion(question)}
                                  color="primary"
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() =>
                                    handleDeleteQuestion(question.id)
                                  }
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ mt: 1, ml: 4 }}>
                            {question.options.map((option) => (
                              <Box
                                key={option.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                {question.correctAnswers.includes(
                                  option.id
                                ) && (
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                    sx={{ mr: 1 }}
                                  />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight:
                                      question.correctAnswers.includes(
                                        option.id
                                      )
                                        ? "bold"
                                        : "normal",
                                    color: question.correctAnswers.includes(
                                      option.id
                                    )
                                      ? "success.main"
                                      : "text.primary",
                                  }}
                                >
                                  {option.text}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>
    </Box>
  );
};

export default QuizEditor;
