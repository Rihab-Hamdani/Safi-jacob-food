# Safi Jacob Food

Site de commande et de présentation pour Safi Jacob Food, à Monastir et Lamta. Le prototype permet de parcourir la carte, personnaliser un plat, choisir un restaurant et simuler une commande à emporter ou en livraison.

> **Prototype:** les commandes ne sont pas transmises au restaurant et aucun paiement n'est effectué.

## Fonctionnalités

- Carte interactive par catégories : tacos, mlawi, chapati, makloub, pizzas et extras
- Personnalisation des plats et panier
- Choix du restaurant, du mode de commande et de la zone de livraison
- Présentation des étapes de préparation et des adresses
- Interface responsive en français avec support du contenu arabe

## Stack

- React 18, Vite et TypeScript
- CSS et JavaScript de présentation
- Lucide React, Motion et polices Fontsource

## Développement

```bash
npm install
npm run dev
```

Ouvrir ensuite l'URL affichée par Vite. Pour servir une version statique sans installer les dépendances :

```bash
python -m http.server
```

Puis ouvrir <http://localhost:8000>.

## Personnalisation

| Besoin | Fichier |
|---|---|
| Produits, prix et suppléments | `assets/menu.js` |
| Restaurants, téléphones et zones | `assets/app.js` |
| Photos des catégories | `assets/app.js` (`CAT_IMG`) |
| Animation de préparation | `assets/xhero.js` |
| Images et vidéos | `assets/img/` et `assets/video/` |

Les prix, frais et minimums de livraison présents dans le prototype doivent être validés avec le restaurant avant toute mise en production.
