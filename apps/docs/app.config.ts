export default defineAppConfig({
  docus: {
    title: 'VIntl for Nuxt',
    description: 'Internationalization for your Nuxt apps',
    url: 'https://vintl-nuxt.netlify.app',
    // image: '/social-card-preview.png',
    socials: {
      github: 'vintl-dev/nuxt',
    },
    github: {
      dir: 'apps/docs/content',
      repo: 'nuxt',
      owner: 'vintl-dev',
      branch: 'main',
      edit: true,
    },
    layout: 'default',
    header: {
      title: 'VIntl for Nuxt',
      logo: false,
      showLinkIcon: false,
    },
    footer: {
      credits: {
        icon: 'IconDocus',
        text: 'Powered by Docus',
        href: 'https://docus.dev',
      },
      textLinks: [],
      iconLinks: [],
    },
  },
})
