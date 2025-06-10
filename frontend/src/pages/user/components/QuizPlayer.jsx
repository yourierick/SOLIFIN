import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Paper,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import axios from "axios";

const QuizPlayer = ({ moduleId, onComplete }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [previousResults, setPreviousResults] = useState(null);
  const [loadingPreviousResults, setLoadingPreviousResults] = useState(true);

  // Charger le contenu du module (quiz)
  useEffect(() => {
    const fetchModuleContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier s'il y a des résultats précédents
        try {
          const resultsResponse = await axios.get(
            `/api/formations/modules/${moduleId}/quiz/results`
          );
          if (resultsResponse.data.success) {
            setPreviousResults(resultsResponse.data.data);
          }
        } catch (err) {
          // Ignorer l'erreur si aucun résultat précédent n'est trouvé
          if (err.response && err.response.status !== 404) {
            console.error("Erreur lors de la récupération des résultats:", err);
          }
        } finally {
          setLoadingPreviousResults(false);
        }

        // Récupérer le contenu du module
        // Comme nous n'avons pas l'ID de la formation dans les props, nous utilisons la route du UserFormationController
        const response = await axios.get(`/api/formations/modules/${moduleId}`);
        if (response.data.success) {
          const moduleData = response.data.data;

          // Vérifier que c'est bien un quiz
          if (moduleData.type !== "quiz") {
            setError("Ce module n'est pas un quiz");
            setLoading(false);
            return;
          }

          // Analyser le contenu JSON du quiz
          try {
            const quizContent = JSON.parse(moduleData.content);
            setQuizData({
              ...moduleData,
              content: quizContent,
            });
          } catch (e) {
            console.error("Erreur lors de l'analyse du contenu du quiz:", e);
            setError("Le format du quiz est invalide");
          }
        } else {
          setError("Impossible de charger le quiz");
        }
      } catch (err) {
        console.error("Erreur lors du chargement du module:", err);
        setError(
          err.response?.data?.message ||
            "Une erreur est survenue lors du chargement du quiz"
        );
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchModuleContent();
    }
  }, [moduleId]);

  // Gérer le changement de réponse pour les questions à choix unique
  const handleSingleAnswerChange = (questionId, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Gérer le changement de réponse pour les questions à choix multiples
  const handleMultipleAnswerChange = (questionId, optionId, checked) => {
    setUserAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];

      if (checked) {
        // Ajouter l'option si elle n'est pas déjà sélectionnée
        return {
          ...prev,
          [questionId]: [...currentAnswers, optionId].filter(
            (value, index, self) => self.indexOf(value) === index
          ),
        };
      } else {
        // Supprimer l'option
        return {
          ...prev,
          [questionId]: currentAnswers.filter((id) => id !== optionId),
        };
      }
    });
  };

  // Soumettre les réponses du quiz
  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.post(
        `/api/formations/modules/${moduleId}/quiz/submit`,
        {
          answers: userAnswers,
        }
      );

      if (response.data.success) {
        setResults(response.data.data);

        // Notifier le composant parent que le quiz est terminé
        if (onComplete && typeof onComplete === "function") {
          onComplete(response.data.data);
        }
      } else {
        setError("Erreur lors de la soumission du quiz");
      }
    } catch (err) {
      console.error("Erreur lors de la soumission du quiz:", err);
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de la soumission du quiz"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Passer à la question suivante
  const handleNext = () => {
    const questions = quizData?.content?.questions || [];
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Revenir à la question précédente
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Vérifier si l'utilisateur a répondu à la question actuelle
  const isCurrentQuestionAnswered = () => {
    const questions = quizData?.content?.questions || [];
    if (questions.length === 0) return false;

    const currentQuestion = questions[currentStep];
    const questionId = currentQuestion.id || currentStep;
    const answer = userAnswers[questionId];

    if (currentQuestion.type === "multiple") {
      return Array.isArray(answer) && answer.length > 0;
    }

    return answer !== undefined && answer !== null;
  };

  // Vérifier si toutes les questions ont une réponse
  const areAllQuestionsAnswered = () => {
    const questions = quizData?.content?.questions || [];
    if (questions.length === 0) return false;

    return questions.every((question, index) => {
      const questionId = question.id || index;
      const answer = userAnswers[questionId];

      if (question.type === "multiple") {
        return Array.isArray(answer) && answer.length > 0;
      }

      return answer !== undefined && answer !== null;
    });
  };

  // Afficher les résultats du quiz
  const renderResults = (resultData) => {
    const {
      score,
      totalQuestions,
      percentage,
      questions,
      results: questionResults,
    } = resultData;

    return (
      <Box sx={{ mt: 3 }}>
        <Card
          sx={{
            mb: 3,
            bgcolor: isDarkMode ? "#1f2937" : "#f8fafc",
            background: isDarkMode ? "#1f2937" : "#f8fafc",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Résultats du Quiz
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                my: 3,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  mx: 2,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={percentage}
                  size={80}
                  thickness={5}
                  sx={{
                    color:
                      percentage >= 70
                        ? "success.main"
                        : percentage >= 40
                        ? "warning.main"
                        : "error.main",
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h6" component="div">
                    {Math.round(percentage)}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6">
                  {score} / {totalQuestions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {percentage >= 70
                    ? "Excellent travail!"
                    : percentage >= 40
                    ? "Bon travail, mais vous pouvez vous améliorer."
                    : "Vous devriez revoir ce module."}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          Détails des réponses
        </Typography>

        {questions.map((question, index) => {
          const questionId = question.id || index;
          const result = questionResults[questionId];
          const userAnswer = result.userAnswer;
          const correctAnswers = result.correctAnswers;
          const isCorrect = result.isCorrect;

          return (
            <Paper
              key={questionId}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                borderLeft: "4px solid",
                borderColor: isCorrect ? "success.main" : "error.main",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                <Box sx={{ mr: 1, mt: 0.5 }}>
                  {isCorrect ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </Box>
                <Typography variant="subtitle1">
                  {index + 1}. {question.text}
                </Typography>
              </Box>

              <Box sx={{ ml: 4 }}>
                {question.options.map((option) => {
                  const isUserSelected = Array.isArray(userAnswer)
                    ? userAnswer.includes(option.id)
                    : userAnswer === option.id;

                  const isCorrectOption = correctAnswers.includes(option.id);

                  return (
                    <Box
                      key={option.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        py: 0.5,
                        color: isCorrectOption
                          ? "success.main"
                          : isUserSelected && !isCorrectOption
                          ? "error.main"
                          : "text.primary",
                      }}
                    >
                      {isUserSelected ? (
                        isCorrectOption ? (
                          <CheckCircleIcon
                            fontSize="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        ) : (
                          <CancelIcon
                            fontSize="small"
                            color="error"
                            sx={{ mr: 1 }}
                          />
                        )
                      ) : isCorrectOption ? (
                        <CheckCircleIcon
                          fontSize="small"
                          color="success"
                          sx={{ mr: 1 }}
                        />
                      ) : (
                        <Box sx={{ width: 24, mr: 1 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isCorrectOption ? "bold" : "normal",
                        }}
                      >
                        {option.text}
                      </Typography>
                    </Box>
                  );
                })}

                {question.explanation && (
                  <Box
                    sx={{
                      mt: 1,
                      bgcolor: isDarkMode
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(59, 130, 246, 0.05)",
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="info.main">
                      <strong>Explication:</strong> {question.explanation}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}

        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setResults(null);
            setPreviousResults(null);
            setUserAnswers({});
            setCurrentStep(0);
          }}
          startIcon={<QuestionAnswerIcon />}
          sx={{ mt: 2 }}
        >
          Refaire le quiz
        </Button>
      </Box>
    );
  };

  // Afficher le quiz
  const renderQuiz = () => {
    const questions = quizData?.content?.questions || [];
    if (questions.length === 0) {
      return (
        <Alert severity="warning">Ce quiz ne contient aucune question.</Alert>
      );
    }

    const currentQuestion = questions[currentStep];
    const questionId = currentQuestion.id || currentStep;
    const questionType = currentQuestion.type || "single";

    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Stepper
            activeStep={currentStep}
            orientation="horizontal"
            sx={{ overflowX: "auto", pb: 2 }}
          >
            {questions.map((q, index) => (
              <Step
                key={index}
                completed={userAnswers[q.id || index] !== undefined}
              >
                <StepLabel>{`Q${index + 1}`}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Card sx={{ mb: 3, bgcolor: isDarkMode ? "#1f2937" : "#fff" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Question {currentStep + 1} sur {questions.length}
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              {currentQuestion.text}
            </Typography>

            <FormControl component="fieldset" sx={{ width: "100%" }}>
              {questionType === "single" ? (
                <RadioGroup
                  value={userAnswers[questionId] || ""}
                  onChange={(e) =>
                    handleSingleAnswerChange(questionId, e.target.value)
                  }
                >
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio />}
                      label={option.text}
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                        },
                      }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Box>
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    Sélectionnez toutes les réponses correctes
                  </FormLabel>
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={
                            Array.isArray(userAnswers[questionId]) &&
                            userAnswers[questionId].includes(option.id)
                          }
                          onChange={(e) =>
                            handleMultipleAnswerChange(
                              questionId,
                              option.id,
                              e.target.checked
                            )
                          }
                        />
                      }
                      label={option.text}
                      sx={{
                        display: "block",
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.03)",
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </FormControl>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            startIcon={<NavigateBeforeIcon />}
          >
            Précédent
          </Button>

          <Box>
            {currentStep === questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitQuiz}
                disabled={!areAllQuestionsAnswered() || submitting}
                startIcon={
                  submitting ? <CircularProgress size={20} /> : <CheckIcon />
                }
              >
                {submitting ? "Soumission..." : "Terminer le quiz"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered()}
                endIcon={<NavigateNextIcon />}
              >
                Suivant
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  // Afficher un message d'erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  // Afficher un indicateur de chargement
  if (loading || loadingPreviousResults) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Afficher les résultats précédents ou le quiz
  if (results) {
    return renderResults(results);
  } else if (previousResults) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous avez déjà complété ce quiz. Voici vos résultats:
        </Alert>
        {renderResults(previousResults)}
      </Box>
    );
  } else {
    return renderQuiz();
  }
};

export default QuizPlayer;
