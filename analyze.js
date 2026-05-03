import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Tu es un assistant de la Compagnie des Guides Conférenciers à Paris.
Tu analyses des emails de demande reçus sur contact@compagnie-guides.com et tu extrais les informations pour créer une fiche de demande structurée.
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.
Structure JSON requise :
{
  "type": "B2C" ou "B2B",
  "produit": "nom du produit/visite ou null si non identifiable",
  "produit_ambigu": true ou false,
  "date": "date au format DD/MM/YYYY ou null",
  "date_note": "note si date approximative ou plusieurs options, sinon null",
  "heure": "HH:MM ou null",
  "langue": "Français" ou "Anglais" ou "Allemand" ou "Espagnol" ou "Italien" ou "Autre" ou null,
  "nb_pax": nombre entier ou null,
  "nb_pax_note": "note si fourchette ou incertain, sinon null",
  "contact_nom": "Prénom Nom",
  "contact_email": "email",
  "contact_tel": "téléphone ou null",
  "entreprise": "nom entreprise ou null",
  "commentaires": "résumé en 1-2 phrases du besoin spécifique",
  "champs_manquants": ["liste des champs importants absents"],
  "niveau_confiance": "COMPLET" ou "PARTIEL" ou "INCOMPLET"
}
Produits catalogue : Notre-Dame, Musée du Louvre, Musée d'Orsay, Marais, Montmartre, Sainte-Chapelle, Conciergerie, City tour en bus, Maisons closes, Paris des écrivains, Passages parisiens, Panthéon, Bourse de commerce, Île de la Cité, Troyes Centre historique, Reims, LaM Lille, Basilique de Saint-Denis.
Si la visite demandée ne correspond à aucun produit catalogue, mettre produit_ambigu=true et décrire dans commentaires.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email manquant" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analyse cet email et produis la fiche JSON :\n\n${email}` }],
    });

    const text = message.content[0].text.trim().replace(/```json|```/g, "").trim();
    const fiche = JSON.parse(text);
    res.status(200).json(fiche);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
