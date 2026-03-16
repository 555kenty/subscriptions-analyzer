import { CancellationLink } from '@/types';

const CANCELLATION_LINKS: Record<string, CancellationLink> = {
  'Netflix': {
    url: 'https://www.netflix.com/cancelplan',
    label: 'Annuler Netflix'
  },
  'Prime Video': {
    url: 'https://www.amazon.fr/gp/video/settings',
    label: 'Gérer Prime Video'
  },
  'Disney+': {
    url: 'https://www.disneyplus.com/account',
    label: 'Annuler Disney+'
  },
  'Spotify': {
    url: 'https://www.spotify.com/account/subscription/',
    label: 'Annuler Spotify'
  },
  'Deezer': {
    url: 'https://www.deezer.com/account/subscription',
    label: 'Annuler Deezer'
  },
  'Apple Music': {
    url: 'https://music.apple.com/subscriptions',
    label: 'Gérer Apple Music'
  },
  'YouTube Premium': {
    url: 'https://www.youtube.com/paid_memberships',
    label: 'Annuler YouTube Premium'
  },
  'Canal+': {
    url: 'https://www.canalplus.com/assistance/resilier-mon-abonnement',
    label: 'Résilier Canal+'
  },
  'OCS': {
    url: 'https://www.ocs.fr/compte',
    label: 'Gérer OCS'
  },
  'Adobe Creative Cloud': {
    url: 'https://account.adobe.com/plans',
    label: 'Annuler Adobe'
  },
  'Microsoft 365': {
    url: 'https://account.microsoft.com/services/',
    label: 'Gérer Microsoft 365'
  },
  'Notion': {
    url: 'https://www.notion.so/settings/billing',
    label: 'Gérer Notion'
  },
  'Figma': {
    url: 'https://www.figma.com/settings/billing',
    label: 'Gérer Figma'
  },
  'GitHub': {
    url: 'https://github.com/settings/billing',
    label: 'Gérer GitHub'
  },
  'GitLab': {
    url: 'https://gitlab.com/-/subscriptions',
    label: 'Gérer GitLab'
  },
  'Dropbox': {
    url: 'https://www.dropbox.com/account/plan',
    label: 'Annuler Dropbox'
  },
  'Google One': {
    url: 'https://one.google.com/settings',
    label: 'Gérer Google One'
  },
  'iCloud': {
    url: 'https://www.icloud.com/settings',
    label: 'Gérer iCloud'
  },
  'OneDrive': {
    url: 'https://account.microsoft.com/services/',
    label: 'Gérer OneDrive'
  },
  'Box': {
    url: 'https://app.box.com/account/plan',
    label: 'Annuler Box'
  },
  'PlayStation Plus': {
    url: 'https://www.playstation.com/fr-fr/ps-plus/',
    label: 'Gérer PlayStation Plus'
  },
  'Xbox Game Pass': {
    url: 'https://account.microsoft.com/services/',
    label: 'Gérer Xbox Game Pass'
  },
  'Nintendo Switch Online': {
    url: 'https://accounts.nintendo.com/',
    label: 'Gérer Nintendo Switch Online'
  },
  'Le Monde': {
    url: 'https://abonnes.lemonde.fr/',
    label: 'Gérer Le Monde'
  },
  'Le Figaro': {
    url: 'https://moncompte.lefigaro.fr/',
    label: 'Gérer Le Figaro'
  },
  'Libération': {
    url: 'https://www.liberation.fr/mon-compte/',
    label: 'Gérer Libération'
  },
  'Mediapart': {
    url: 'https://www.mediapart.fr/abonnements',
    label: 'Gérer Mediapart'
  },
  'New York Times': {
    url: 'https://www.nytimes.com/subscription',
    label: 'Gérer NYT'
  },
  'The Guardian': {
    url: 'https://manage.theguardian.com/',
    label: 'Gérer The Guardian'
  },
  'Substack': {
    url: 'https://substack.com/settings',
    label: 'Gérer Substack'
  },
  'Basic-Fit': {
    url: 'https://www.basic-fit.com/fr-fr/my-basic-fit',
    label: 'Gérer Basic-Fit'
  },
  'Neoness': {
    url: 'https://www.neoness.fr/mon-compte',
    label: 'Gérer Neoness'
  },
  'Keepcool': {
    url: 'https://www.keepcool.fr/mon-compte',
    label: 'Gérer Keepcool'
  },
  'Apple Fitness+': {
    url: 'https://fitness.apple.com/settings',
    label: 'Gérer Apple Fitness+'
  },
  'Peloton': {
    url: 'https://members.onepeloton.com/preferences/subscription',
    label: 'Gérer Peloton'
  },
  'Strava': {
    url: 'https://www.strava.com/settings/subscription',
    label: 'Gérer Strava'
  },
  'MyFitnessPal': {
    url: 'https://www.myfitnesspal.com/account/subscription',
    label: 'Gérer MyFitnessPal'
  },
  'HelloFresh': {
    url: 'https://www.hellofresh.fr/account-settings/subscription-settings',
    label: 'Gérer HelloFresh'
  },
  'Quitoque': {
    url: 'https://www.quitoque.fr/mon-compte',
    label: 'Gérer Quitoque'
  },
  'Frichti': {
    url: 'https://www.frichti.co/account',
    label: 'Gérer Frichti'
  },
  'Uber Eats Pass': {
    url: 'https://www.ubereats.com/fr/account/pass',
    label: 'Gérer Uber Eats Pass'
  },
  'Deliveroo Plus': {
    url: 'https://deliveroo.fr/fr/account/plus',
    label: 'Gérer Deliveroo Plus'
  },
};

export function getCancellationLink(subscriptionName: string): CancellationLink | undefined {
  return CANCELLATION_LINKS[subscriptionName];
}

export function hasCancellationLink(subscriptionName: string): boolean {
  return subscriptionName in CANCELLATION_LINKS;
}
