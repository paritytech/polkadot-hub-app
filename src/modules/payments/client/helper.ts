export const appearance = {
  theme: 'stripe',
  variables: {
    fontFamily: ' "Inter", sans-serif',
    borderRadius: '32px',
    accessibleColorOnColorPrimary: '#262626',
    focusOutline: 'none',
    focusBoxShadow: 'none',
    colorTextSecondary: '#868685',
  },
  rules: {
    '.Input': {
      borderColor: '#EBEBEB',
      marginBottom: '6px',
      boxShadow: 'none',
      padding: '12px 16px',
    },
    '.Input:hover': {
      borderColor: '#000000',
      outline: 'var(--focusOutline)',
    },
    '.Input:focus': {
      borderColor: '#000000',
      outline: 'var(--focusOutline)',
    },
    '.Label': {
      color: 'var(--colorTextSecondary)',
      fontSize: '16px',
      textTransform: 'lowercase',
    },
  },
}
