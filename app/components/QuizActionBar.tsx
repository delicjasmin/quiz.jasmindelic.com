"use client";

import {
  DeleteOutlined,
  Link as LinkIcon,
  PlayArrow,
  SettingsOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import type { ReactNode } from "react";

type QuizActionBarProps = {
  playHref?: string;
  onSettings: () => void;
  onDelete: () => void;
  deleteLabel: string;
  share?: {
    isShared: boolean;
    pending?: boolean;
    onToggle: () => void;
    onCopyLink: () => void;
  };
};

type ClusterAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "error";
};

export function QuizActionBar({
  playHref,
  onSettings,
  onDelete,
  deleteLabel,
  share,
}: QuizActionBarProps) {
  const actions: ClusterAction[] = [
    {
      label: "Settings",
      icon: <SettingsOutlined fontSize="small" />,
      onClick: onSettings,
    },
  ];

  if (share) {
    actions.push(
      {
        label: share.isShared ? "Stop sharing" : "Share quiz",
        icon: <ShareOutlined fontSize="small" />,
        onClick: share.onToggle,
        disabled: share.pending,
        ...(share.isShared ? { tone: "primary" as const } : {}),
      },
      {
        label: share.isShared ? "Copy link" : "Share the quiz to copy a link",
        icon: <LinkIcon fontSize="small" />,
        onClick: share.onCopyLink,
        disabled: !share.isShared,
      },
    );
  }

  actions.push({
    label: deleteLabel,
    icon: <DeleteOutlined fontSize="small" />,
    onClick: onDelete,
    tone: "error",
  });

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
      }}
    >
      {playHref ? (
        <Button
          component={Link}
          href={playHref}
          variant="contained"
          size="small"
          startIcon={<PlayArrow />}
          sx={{ height: 36 }}
        >
          Play
        </Button>
      ) : null}

      <Box sx={{ display: "inline-flex" }}>
        {actions.map((action, index) => {
          const isFirst = index === 0;
          const isLast = index === actions.length - 1;

          return (
            <Tooltip key={action.label} title={action.label}>
              <span>
                <IconButton
                  aria-label={action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  sx={(theme) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 0,
                    border: 1,
                    borderColor: "divider",
                    borderLeftWidth: isFirst ? 1 : 0,
                    borderTopLeftRadius: isFirst ? theme.shape.borderRadius : 0,
                    borderBottomLeftRadius: isFirst
                      ? theme.shape.borderRadius
                      : 0,
                    borderTopRightRadius: isLast ? theme.shape.borderRadius : 0,
                    borderBottomRightRadius: isLast
                      ? theme.shape.borderRadius
                      : 0,
                    color:
                      action.tone === "error"
                        ? "error.main"
                        : action.tone === "primary"
                          ? "primary.main"
                          : "text.secondary",
                    bgcolor:
                      action.tone === "primary"
                        ? "action.selected"
                        : "transparent",
                    "&:hover": {
                      bgcolor:
                        action.tone === "error" ? "error.main" : "action.hover",
                      color:
                        action.tone === "error"
                          ? "error.contrastText"
                          : undefined,
                    },
                    "&.Mui-disabled": {
                      borderColor: "divider",
                    },
                  })}
                >
                  {action.icon}
                </IconButton>
              </span>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
