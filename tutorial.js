// Estado do Tutorial
let tutorialAtivo = false;
let etapaAtual = 0;
let overlayEl = null;
let balaoEl = null;
let secaoRespostaOriginalDisplay = 'none';

// Etapas do Tutorial explicadas de forma simples para crianças
const etapasTutorial = [
    {
        seletor: null, // Sem alvo, centralizado na tela
        posicao: 'centro',
        texto: '<strong>Olá! Bem-vindo ao Jogo do Pratinho CDU!</strong> 🎮✨<br><br>Vamos fazer um passeio rápido para você aprender a jogar? É super fácil e divertido!'
    },
    {
        seletor: '.placar-header',
        posicao: 'acima', // Seta aponta para cima, balão fica abaixo
        texto: 'Aqui em cima fica o <strong>Placar</strong>! 📊<br><br>Na 👤 <strong>esquerda</strong> aparecem as suas pontuações e na 💻 <strong>direita</strong> as da CPU.<br>Quem somar mais pontos após as <strong>6 rodadas</strong> vence!'
    },
    {
        seletor: '#btn-lancar',
        posicao: 'abaixo', // Seta aponta para baixo, balão fica acima
        texto: 'Este é o botão de <strong>Lançar Cubos</strong>! 🎲<br><br>Quando for o seu turno, clique aqui para sortear e jogar os cubinhos dentro dos pratos.'
    },
    {
        seletor: '#pratinho',
        posicao: 'acima', // Seta aponta para cima, balão fica abaixo
        texto: 'Estes são os pratos <strong>CDU</strong>! <br><br>🟢<strong>C</strong>entena: cada cubo verde vale <strong>100</strong> pontos.<br>🔴 <strong>D</strong>ezena: cada cubo vermelho vale <strong>10</strong> pontos.<br>🟡 <strong>U</strong>nidade: cada cubo amarelo vale <strong>1</strong> ponto.'
    },
    {
        seletor: '#secao-resposta',
        posicao: 'abaixo', // Seta aponta para baixo, balão fica acima
        texto: 'Aqui fica a área de <strong>Resposta</strong>! ⏱️✏️<br><br>Você terá <strong>20 segundos</strong> para somar os cubos dos pratos, digitar o valor correto e clicar em <strong>Confirmar</strong>!'
    }
];

/**
 * Inicializa e exibe o tutorial
 */
function iniciarTutorial() {
    if (tutorialAtivo) return;
    tutorialAtivo = true;
    etapaAtual = 0;

    // Salva o display original da seção de resposta antes de modificá-la
    const secaoResposta = document.getElementById('secao-resposta');
    if (secaoResposta) {
        secaoRespostaOriginalDisplay = secaoResposta.style.display || 'none';
    }

    // Cria a máscara escura (overlay) se não existir
    if (!overlayEl) {
        overlayEl = document.createElement('div');
        overlayEl.className = 'tutorial-overlay';
        document.body.appendChild(overlayEl);
    } else {
        overlayEl.style.display = 'block';
    }

    // Cria o balão popover se não existir
    if (!balaoEl) {
        balaoEl = document.createElement('div');
        balaoEl.className = 'tutorial-balao';
        document.body.appendChild(balaoEl);
    } else {
        balaoEl.style.display = 'block';
    }

    // Registra interceptores de cliques e teclado para isolar o jogo durante o tutorial
    window.addEventListener('click', interceptarCliques, true);
    window.addEventListener('keydown', interceptarTeclado, true);
    window.addEventListener('resize', reposicionarBalaoAtivo);

    mostrarEtapa(0);
}

/**
 * Exibe uma etapa específica do tutorial
 */
function mostrarEtapa(index) {
    if (index < 0 || index >= etapasTutorial.length) {
        finalizarTutorial();
        return;
    }
    etapaAtual = index;
    const etapa = etapasTutorial[index];

    // Remove destaque do elemento anterior
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });

    // Controla a exibição temporária da seção de resposta no tutorial
    const secaoResposta = document.getElementById('secao-resposta');
    if (secaoResposta) {
        if (etapa.seletor === '#secao-resposta') {
            secaoResposta.style.display = 'flex';
        } else {
            secaoResposta.style.display = secaoRespostaOriginalDisplay;
        }
    }

    // Renderiza o conteúdo do balão popover
    const eUltimaEtapa = index === etapasTutorial.length - 1;
    balaoEl.innerHTML = `
        <p class="tutorial-texto">${etapa.texto}</p>
        <div class="tutorial-rodape">
            <span class="tutorial-passos">${index + 1} de ${etapasTutorial.length}</span>
            <div class="tutorial-botoes">
                <button class="tutorial-btn tutorial-btn-pular" onclick="pularTutorial()">Pular</button>
                <button class="tutorial-btn tutorial-btn-proximo" onclick="proximaEtapa()">
                    ${eUltimaEtapa ? 'Jogar! 🚀' : 'Próximo'}
                </button>
            </div>
        </div>
    `;

    // Destaca o elemento alvo se aplicável
    let targetEl = null;
    if (etapa.seletor) {
        targetEl = document.querySelector(etapa.seletor);
        if (targetEl) {
            targetEl.classList.add('tutorial-highlight');
            // Garante que o elemento seja visível rolando a tela se necessário
            targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    // Reposiciona o balão (usa timeout curto para esperar renderização do texto no DOM e cálculo de altura)
    setTimeout(() => {
        posicionarBalao(targetEl, etapa.posicao, balaoEl);
    }, 50);
}

/**
 * Posiciona o balão de forma responsiva ao redor do elemento em destaque
 */
function posicionarBalao(targetEl, posicaoBalao, balaoEl) {
    if (window.innerWidth <= 600) {
        // No mobile, remove estilos inline e aplica a classe mobile
        balaoEl.style.position = '';
        balaoEl.style.bottom = '';
        balaoEl.style.top = '';
        balaoEl.style.left = '';
        balaoEl.style.transform = '';
        balaoEl.className = 'tutorial-balao tutorial-balao-mobile';
        return;
    }

    if (!targetEl || posicaoBalao === 'centro') {
        // Centralização absoluta na tela
        balaoEl.style.position = 'fixed';
        balaoEl.style.top = '50%';
        balaoEl.style.left = '50%';
        balaoEl.style.transform = 'translate(-50%, -50%)';
        balaoEl.className = 'tutorial-balao';
        return;
    }

    balaoEl.style.position = 'absolute';
    balaoEl.style.transform = 'none';

    const rect = targetEl.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    let top = 0;
    let left = 0;
    const gap = 15;

    // Reseta e redefine classes de seta no balão
    balaoEl.className = 'tutorial-balao';
    balaoEl.classList.add(`seta-${posicaoBalao}`);

    const balaoWidth = balaoEl.offsetWidth;
    const balaoHeight = balaoEl.offsetHeight;

    // Calcula coordenadas baseado no posicionamento
    if (posicaoBalao === 'acima') { // Seta aponta para cima, balão fica ABAIXO do elemento
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + (rect.width - balaoWidth) / 2;
    } else if (posicaoBalao === 'abaixo') { // Seta aponta para baixo, balão fica ACIMA do elemento
        top = rect.top + scrollY - balaoHeight - gap;
        left = rect.left + scrollX + (rect.width - balaoWidth) / 2;
    } else if (posicaoBalao === 'esquerda') { // Seta aponta para a esquerda, balão fica à DIREITA
        top = rect.top + scrollY + (rect.height - balaoHeight) / 2;
        left = rect.right + scrollX + gap;
    } else if (posicaoBalao === 'direita') { // Seta aponta para a direita, balão fica à ESQUERDA
        top = rect.top + scrollY + (rect.height - balaoHeight) / 2;
        left = rect.left + scrollX - balaoWidth - gap;
    }

    // Protege o balão de ultrapassar os limites horizontais da tela
    const margem = 10;
    const maxLeft = window.innerWidth - balaoWidth - margem;
    if (left < margem) left = margem;
    if (left > maxLeft) left = maxLeft;

    // Protege o balão de ultrapassar limites verticais
    const maxTop = document.documentElement.scrollHeight - balaoHeight - margem;
    if (top < margem) top = margem;
    if (top > maxTop) top = maxTop;

    balaoEl.style.top = `${top}px`;
    balaoEl.style.left = `${left}px`;
}

/**
 * Avança para a próxima etapa do tutorial
 */
function proximaEtapa() {
    mostrarEtapa(etapaAtual + 1);
}

/**
 * Pula o tutorial salvando a preferência no localStorage
 */
function pularTutorial() {
    localStorage.setItem('cdu_tutorial_visto', 'true');
    finalizarTutorial();
}

/**
 * Remove todos os elementos e manipuladores do tutorial
 */
function finalizarTutorial() {
    tutorialAtivo = false;

    // Remove interceptores
    window.removeEventListener('click', interceptarCliques, true);
    window.removeEventListener('keydown', interceptarTeclado, true);
    window.removeEventListener('resize', reposicionarBalaoAtivo);

    // Remove destaques
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });

    // Oculta overlay e balão
    if (overlayEl) overlayEl.style.display = 'none';
    if (balaoEl) balaoEl.style.display = 'none';

    // Restaura display da seção de resposta
    const secaoResposta = document.getElementById('secao-resposta');
    if (secaoResposta) {
        secaoResposta.style.display = secaoRespostaOriginalDisplay;
    }
}

/**
 * Reinicia o tutorial manualmente (chamado pelo botão "❓")
 */
function reiniciarTutorialManual() {
    iniciarTutorial();
}

/**
 * Reposiciona o balão ativo no caso de redimensionamento da janela
 */
function reposicionarBalaoAtivo() {
    if (!tutorialAtivo || etapaAtual < 0 || etapaAtual >= etapasTutorial.length) return;
    const etapa = etapasTutorial[etapaAtual];
    const targetEl = etapa.seletor ? document.querySelector(etapa.seletor) : null;
    posicionarBalao(targetEl, etapa.posicao, balaoEl);
}

/**
 * Intercepta e cancela cliques fora do balão do tutorial
 */
function interceptarCliques(e) {
    if (balaoEl && balaoEl.contains(e.target)) {
        return; // Permite cliques dentro do balão do tutorial
    }
    e.stopPropagation();
    e.preventDefault();
}

/**
 * Intercepta teclas enquanto o tutorial está ativo
 */
function interceptarTeclado(e) {
    if (e.key === 'Escape') {
        pularTutorial();
        return;
    }
    e.stopPropagation();
    e.preventDefault();
}
