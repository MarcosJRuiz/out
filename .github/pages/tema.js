// Acompanha o tema escolhido no relatório Allure: ele grava "auto", "light" ou "dark" em localStorage.theme.
// Todas as páginas do site têm a mesma origem, então uma troca de tema dispara o evento "storage" nas demais.
(() => {
  const raiz = document.documentElement;
  const sistemaEscuro = matchMedia('(prefers-color-scheme: dark)');
  const escolhido = () => {
    try {
      return localStorage.getItem('theme') ?? 'auto';
    } catch {
      return 'auto';
    }
  };
  const aplicar = () => {
    const tema = escolhido();
    const escuro = tema === 'dark' || (tema === 'auto' && sistemaEscuro.matches);
    raiz.dataset.theme = escuro ? 'dark' : 'light';
  };
  aplicar();
  addEventListener('storage', (evento) => evento.key === 'theme' && aplicar());
  sistemaEscuro.addEventListener('change', aplicar);

  // Usado pelo botão de tema da barra superior.
  window.tema = {
    escolhido,
    definir(tema) {
      try {
        localStorage.setItem('theme', tema);
      } catch {
        // Sem localStorage (ex.: navegação privada): o tema vale só para esta página.
      }
      aplicar();
    },
  };
})();
