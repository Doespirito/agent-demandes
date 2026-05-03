export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const data = req.body;
  const BASE = process.env.AIRTABLE_BASE;
  const TABLE = process.env.AIRTABLE_TABLE;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  function toISO(d) {
    if (!d) return null;
    const parts = d.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const titreParts = [data.contact_nom, data.produit, data.date].filter(Boolean);
  const titre = titreParts.join(" — ") || "Nouvelle demande";

  const fields = {
    Titre_demande: titre,
    Statut: "À deviser",
    Date_demande: today,
    Email_original: data.email_original || "",
    Commentaires: data.commentaires || "",
    Notes_internes: "",
  };

  if (data.produit && data.produit !== "— à sélectionner") fields.Produit = data.produit;
  if (data.langue && data.langue !== "— à sélectionner") fields.Langue = data.langue;
  if (data.contact_nom) fields.Contact_nom = data.contact_nom;
  if (data.contact_email) fields.Contact_email = data.contact_email;
  if (data.contact_tel) fields.Contact_tel = data.contact_tel;
  if (data.entreprise) fields.Entreprise = data.entreprise;
  if (data.heure) fields.Heure_visite = data.heure;
  if (data.nb_pax) fields.Nb_pax = parseInt(data.nb_pax) || undefined;
  const iso = toISO(data.date);
  if (iso) fields.Date_visite = iso;

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));

    res.status(200).json({
      ok: true,
      titre,
      n_commande: result.fields?.N_commande ?? "—",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
