import {
  DEFAULT_DESCRIPTION,
  getSiteUrl,
  HOME_TITLE,
  SITE_NAME,
} from "@/lib/seo";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const features = [
  {
    title: "PDF to quiz in one step",
    body: "Upload any PDF and generate questions directly from its content.",
  },
  {
    title: "Flexible question types",
    body: "Choose multiple choice, true/false, or a mixed set with adjustable difficulty.",
  },
  {
    title: "Free to try instantly",
    body: "Start without an account. Sign in later to save quizzes and share them with others.",
  },
];

export function HomeLanding() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <Box
      component="section"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, sm: 7 } }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Box sx={{ mx: "auto", maxWidth: 768, textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.025em",
              fontSize: { xs: "1.875rem", sm: "2.25rem" },
            }}
          >
            {HOME_TITLE}
          </Typography>
          <Typography
            sx={{
              mt: 2,
              color: "text.secondary",
              fontSize: { xs: "1rem", sm: "1.125rem" },
              lineHeight: 1.75,
            }}
          >
            Turn lecture notes, textbooks, and study guides into interactive
            quizzes in seconds. Upload a PDF, choose your settings, and let AI
            create questions you can practice with right away.
          </Typography>
        </Box>

        <Box
          component="ul"
          sx={{
            mx: "auto",
            mt: 5,
            display: "grid",
            maxWidth: 896,
            gap: 2,
            p: 0,
            listStyle: "none",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          }}
        >
          {features.map((feature) => (
            <Paper
              key={feature.title}
              component="li"
              variant="outlined"
              sx={{ p: 2.5, textAlign: "left" }}
            >
              <Typography component="h2" sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {feature.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}
              >
                {feature.body}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
