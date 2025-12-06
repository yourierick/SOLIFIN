import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Box,
  Typography,
  Avatar,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useTheme as useThemeMode } from "../../../contexts/ThemeContext";

const statusLabels = {
  en_attente: "En attente",
  approuve: "Approuvé",
  rejete: "Rejeté",
  revoque: "Révoqué",
};

const statusColors = {
  en_attente: { bg: "#fef3c7", color: "#92400e", dark: { bg: "#451a03", color: "#fde68a" } },
  approuve: { bg: "#d1fae5", color: "#065f46", dark: { bg: "#064e3b", color: "#6ee7b7" } },
  rejete: { bg: "#fee2e2", color: "#991b1b", dark: { bg: "#7f1d1d", color: "#fca5a5" } },
  revoque: { bg: "#f3f4f6", color: "#374151", dark: { bg: "#1f2937", color: "#d1d5db" } },
};

export default function LivreursList({
  livreurs,
  onApprove,
  onReject,
  onDelete,
  onRevoke,
  isPageOwner,
  compact = false,
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  rowsPerPage = 25,
  onRowsPerPageChange,
  totalCount = 0,
}) {
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();

  if (!livreurs || livreurs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          textAlign: "center",
          backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.5)" : "rgba(249, 250, 251, 0.8)",
          borderRadius: 3,
          border: `1px solid ${isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)"}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: isDarkMode ? "#9ca3af" : "#6b7280",
            fontWeight: 500,
            mb: 1,
          }}
        >
          {isPageOwner
            ? "Aucun livreur n'a postulé pour votre page pour le moment."
            : "Vous n'avez pas encore postulé comme livreur pour cette page."}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDarkMode ? "#6b7280" : "#9ca3af",
          }}
        >
          Les candidatures apparaîtront ici dès que des livreurs postuleront.
        </Typography>
      </Box>
    );
  }

  const handlePageChange = (event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleRowsPerPageChange = (event) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  return (
    <Box>
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: isDarkMode
            ? "none"
            : "0 2px 10px rgba(0, 0, 0, 0.05)",
          borderRadius: { xs: 1.5, sm: 2 },
          overflow: "auto",
          maxWidth: "100%",
          background: isDarkMode
            ? "linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))"
            : "linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))",
          backdropFilter: "blur(10px)",
          border: `1px solid ${isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)"}`,
          "&::-webkit-scrollbar": {
            height: { xs: 4, sm: 6 },
            width: { xs: 4, sm: 6 },
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: isDarkMode
              ? "rgba(55, 65, 81, 0.4)"
              : "rgba(0, 0, 0, 0.06)",
            borderRadius: { xs: 2, sm: 3 },
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDarkMode
              ? "rgba(156, 163, 175, 0.6)"
              : "rgba(156, 163, 175, 0.4)",
            borderRadius: { xs: 2, sm: 3 },
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(156, 163, 175, 0.8)"
                : "rgba(156, 163, 175, 0.6)",
            },
          },
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: { xs: "800px", sm: "900px" },
            tableLayout: "fixed",
            "& .MuiTableCell-head": {
              backgroundColor: isDarkMode ? "#111827" : "#f0f4f8",
              fontWeight: "bold",
              color: isDarkMode ? "#fff" : "#334155",
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
              padding: { xs: "8px 10px", sm: "12px 16px" },
              borderBottom: isDarkMode
                ? "1px solid #374151"
                : "2px solid #e2e8f0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            },
            "& .MuiTableCell-body": {
              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
              padding: { xs: "6px 10px", sm: "10px 16px" },
              color: isDarkMode ? "#fff" : "#475569",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            "& .MuiTableRow:hover": {
              backgroundColor: isDarkMode ? "#374151" : "#f8fafc",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
              <TableCell sx={{ width: { xs: "200px", sm: "250px" } }}>Livreur</TableCell>
              <TableCell sx={{ width: { xs: "180px", sm: "220px" } }}>Description</TableCell>
              <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Zone</TableCell>
              <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
              <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Contact</TableCell>
              <TableCell sx={{ width: { xs: "80px", sm: "100px" } }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {livreurs.map((livreur) => (
              <TableRow
                key={livreur.id}
                sx={{
                  "&:hover": {
                    bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                  },
                  borderBottom: `1px solid ${
                    isDarkMode ? "#374151" : "#e2e8f0"
                  }`,
                  bgcolor: isDarkMode ? "#1d2432" : "#fff",
                }}
              >
                <TableCell>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: { xs: 0.75, sm: 1 },
                      py: { xs: 0.4, sm: 0.5 },
                      borderRadius: { xs: 0.75, sm: 1 },
                      background: isDarkMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.1)",
                      border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                      fontWeight: 600,
                      color: isDarkMode ? "#60a5fa" : "#2563eb",
                    }}
                  >
                    #{livreur.id}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={livreur.user?.picture || undefined}
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 2,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    >
                      {livreur.user?.name?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                      <Box
                        sx={{
                          fontWeight: 600,
                          color: isDarkMode ? "#fff" : "#1f2937",
                          fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {livreur.user?.name}
                      </Box>
                      <Box
                        sx={{
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          mt: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {livreur.user?.email}
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      color: isDarkMode ? "#f9fafb" : "#111827",
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      lineHeight: 1.4,
                      maxWidth: { xs: "160px", sm: "200px" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {livreur.description || "Aucune description"}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      color: isDarkMode ? "#f9fafb" : "#111827",
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      fontWeight: 500,
                    }}
                  >
                    {livreur.zone_livraison || "Non spécifiée"}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[livreur.statut]}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode
                        ? statusColors[livreur.statut].dark.bg
                        : statusColors[livreur.statut].bg,
                      color: isDarkMode
                        ? statusColors[livreur.statut].dark.color
                        : statusColors[livreur.statut].color,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    }}
                  >
                    {livreur.coordonnees}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                    {(livreur.statut === "en_attente" || livreur.statut === "revoque") && (
                      <>
                        <Tooltip title="Approuver" arrow>
                          <IconButton
                            onClick={() => onApprove(livreur.id)}
                            size="small"
                            sx={{
                              color: "#10b981",
                              "&:hover": {
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                color: "#059669",
                              },
                            }}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter" arrow>
                          <IconButton
                            onClick={() => onReject(livreur.id)}
                            size="small"
                            sx={{
                              color: "#ef4444",
                              "&:hover": {
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#dc2626",
                              },
                            }}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer" arrow>
                          <IconButton
                            onClick={() => onDelete(livreur.id)}
                            size="small"
                            sx={{
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              "&:hover": {
                                backgroundColor: "rgba(107, 114, 128, 0.1)",
                                color: isDarkMode ? "#d1d5db" : "#374151",
                              },
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {livreur.statut === "approuve" && (
                      <>
                        <Tooltip title="Révoquer" arrow>
                          <IconButton
                            onClick={() => onRevoke(livreur.id)}
                            size="small"
                            sx={{
                              color: "#f59e0b",
                              "&:hover": {
                                backgroundColor: "rgba(245, 158, 11, 0.1)",
                                color: "#d97706",
                              },
                            }}
                          >
                            <NoSymbolIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer" arrow>
                          <IconButton
                            onClick={() => onDelete(livreur.id)}
                            size="small"
                            sx={{
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              "&:hover": {
                                backgroundColor: "rgba(107, 114, 128, 0.1)",
                                color: isDarkMode ? "#d1d5db" : "#374151",
                              },
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination et sélection du nombre de lignes */}
      {pagination && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
            px: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Afficher
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{
                  backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "white",
                  border: `1px solid ${isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)"}`,
                  color: isDarkMode ? "#d1d5db" : "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "rgba(107, 114, 128, 0.8)" : "rgba(156, 163, 175, 0.8)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              résultats par page
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {totalCount > 0
                ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalCount)} sur ${totalCount}`
                : "0 résultats"}
            </Typography>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={compact ? "small" : "medium"}
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root": {
                  backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "white",
                  border: `1px solid ${isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)"}`,
                  color: isDarkMode ? "#d1d5db" : "#374151",
                  fontWeight: 500,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "&:hover": {
                    backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(243, 244, 246, 0.8)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
