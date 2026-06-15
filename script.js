const CONFIG = {
    maxRodadas: 4,
    tempoAnimacao: 600, // milissegundos
    intervaloCubo: 50   // atraso entre a queda de cada cubo
};

// Sons do Jogo
const somCorreto = new Audio('sons/correto.mp3');
const somErro = new Audio('sons/error-notification.mp3');
const somVitoria = new Audio('sons/super-smash-bros-bonus-results.mp3');

// Estado da Partida
let estadoJogo = {
    rodadaAtual: 1,
    jogadorAtual: 0,
    jogadores: [
        { nome: "Jogador", pontos: [], total: 0 },
        { nome: "CPU", pontos: [], total: 0 }
    ]
};

// Controle de Tempo e Validação de Resposta
let temporizadorId = null;
let tempoRestante = 20;
let valorCorretoRodada = 0;

/**
 * Coleta o nome do usuário e inicia a partida contra a CPU
 */
function iniciarPartida() {
    clearInterval(temporizadorId);
    document.getElementById('secao-resposta').style.display = 'none';
    if (document.getElementById('overlay-tempo-esgotado')) {
        document.getElementById('overlay-tempo-esgotado').style.display = 'none';
    }

    const inputNome = document.getElementById('input-nome');
    const nomeDigitado = inputNome.value.trim();
    
    // Define o nome digitado ou mantém o padrão "Jogador"
    estadoJogo.jogadores[0].nome = nomeDigitado || "Jogador";
    estadoJogo.jogadores[1].nome = "CPU";

    // Oculta a tela de cadastro e ativa a tela do placar
    document.getElementById('overlay-inicio').style.display = 'none';
    
    inicializarPlacar();

    // Se for o primeiro acesso, inicia o tutorial interativo automaticamente
    if (localStorage.getItem('cdu_tutorial_visto') !== 'true') {
        if (typeof iniciarTutorial === 'function') {
            iniciarTutorial();
        }
    }
}

/**
 * Inicializa os nomes no placar superior
 */
function inicializarPlacar() {
    document.getElementById('nome-jogador-painel').innerText = `👤 ${estadoJogo.jogadores[0].nome}`;
    atualizarPlacarInterface();
    atualizarStatus();
}

/**
 * Atualiza os valores mostrados nos placares dos cantos
 */
function atualizarPlacarInterface() {
    const jogador = estadoJogo.jogadores[0];
    const cpu = estadoJogo.jogadores[1];

    // Formata pontos do Jogador
    let textoJogador = '-';
    if (jogador.pontos.length > 0) {
        if (jogador.pontos.length < CONFIG.maxRodadas) {
            textoJogador = jogador.pontos.join(' + ') + ' +';
        } else {
            textoJogador = jogador.pontos.join(' + ') + ` = ${jogador.total.toLocaleString('pt-PT')}`;
        }
    }
    document.getElementById('valores-jogador').innerText = textoJogador;

    // Formata pontos da CPU
    let textoCpu = '-';
    if (cpu.pontos.length > 0) {
        if (cpu.pontos.length < CONFIG.maxRodadas) {
            textoCpu = cpu.pontos.join(' + ') + ' +';
        } else {
            textoCpu = cpu.pontos.join(' + ') + ` = ${cpu.total.toLocaleString('pt-PT')}`;
        }
    }
    document.getElementById('valores-cpu').innerText = textoCpu;
}

/**
 * Gerencia a mensagem do painel de controle (Turnos e Vencedor)
 */
function atualizarStatus() {
    const status = document.getElementById('status');
    const { rodadaAtual, jogadorAtual, jogadores } = estadoJogo;

    if (rodadaAtual > CONFIG.maxRodadas) {
        determinarVencedor();
    } else {
        status.innerText = `Vez do ${jogadores[jogadorAtual].nome}`;
    }

    atualizarDestaquesPlacar();
}

/**
 * Atualiza os destaques visuais dos placares (qual jogador está ativo no turno)
 */
function atualizarDestaquesPlacar() {
    const { jogadorAtual, rodadaAtual } = estadoJogo;

    const placarJ = document.getElementById('placar-jogador');
    const placarC = document.getElementById('placar-cpu');

    if (placarJ && placarC) {
        if (rodadaAtual <= CONFIG.maxRodadas) {
            if (jogadorAtual === 0) {
                placarJ.classList.add('placar-ativo');
                placarC.classList.remove('placar-ativo');
            } else {
                placarC.classList.add('placar-ativo');
                placarJ.classList.remove('placar-ativo');
            }
        } else {
            placarJ.classList.remove('placar-ativo');
            placarC.classList.remove('placar-ativo');
        }
    }
}

/**
 * Renderiza fisicamente os cubinhos de madeira na tela com animação
 */
function desenharCubos(idElemento, quantidade) {
    const elemento = document.getElementById(idElemento);
    const container = elemento.querySelector('.cubos-container');

    // Remove cubos antigos
    container.innerHTML = '';

    // Distribui e insere os novos cubinhos de forma gradual
    for (let i = 0; i < quantidade; i++) {
        setTimeout(() => {
            const cubo = document.createElement('div');
            cubo.className = 'cubo';
            container.appendChild(cubo);
        }, i * CONFIG.intervaloCubo);
    }
}

/**
 * Simula o lançamento físico dos cubos nas divisórias CDU para o Jogador Humano
 */
function lancarCubos() {
    // Esconde o botão de lançar para dar lugar à resposta do usuário
    const btn = document.getElementById('btn-lancar');
    btn.style.display = 'none';

    // Gera sorteios aleatórios de 0 a 9 cubos para cada casa decimal
    const c = Math.floor(Math.random() * 6);
    const d = Math.floor(Math.random() * 6);
    const u = Math.floor(Math.random() * 6);

    // Desencadeia o sorteio visual (Animações individuais por zona)
    desenharCubos('zona-c', c);
    desenharCubos('zona-d', d);
    desenharCubos('zona-u', u);

    // Calcula o valor matemático correto da rodada
    valorCorretoRodada = (c * 100) + (d * 10) + u;

    // Aguarda a animação dos cubos terminarem antes de abrir a entrada de resposta
    setTimeout(() => {
        // Exibe o painel de resposta
        const secaoResposta = document.getElementById('secao-resposta');
        secaoResposta.style.display = 'flex';

        // Limpa e foca no campo de input
        const inputResposta = document.getElementById('input-resposta-valor');
        inputResposta.value = '';
        inputResposta.classList.remove('erro-animacao');
        inputResposta.focus();

        // Inicia o cronômetro de 20s
        iniciarTimer();
    }, CONFIG.tempoAnimacao);
}

/**
 * Gerencia o cronômetro regressivo de 20 segundos
 */
function iniciarTimer() {
    clearInterval(temporizadorId);
    
    tempoRestante = 20;
    const timerContagem = document.getElementById('timer-contagem');
    const timerContainer = document.querySelector('.resposta-timer');
    
    timerContagem.innerText = tempoRestante;
    timerContainer.classList.remove('urgente');

    temporizadorId = setInterval(() => {
        tempoRestante--;
        timerContagem.innerText = tempoRestante;

        // Se restarem 3 segundos ou menos, destaca o timer com animação e cor vermelha
        if (tempoRestante <= 3) {
            timerContainer.classList.add('urgente');
        }

        if (tempoRestante <= 0) {
            clearInterval(temporizadorId);
            mostrarTempoEsgotado();
        }
    }, 1000);
}

/**
 * Valida se o usuário digitou o valor correto
 */
function confirmarResposta() {
    const inputElement = document.getElementById('input-resposta-valor');
    const valorDigitado = parseInt(inputElement.value, 10);

    if (valorDigitado === valorCorretoRodada) {
        // Resposta Correta! Para o timer e esconde a seção de respostas
        clearInterval(temporizadorId);
        document.getElementById('secao-resposta').style.display = 'none';

        // Toca o som de acerto
        somCorreto.play().catch(err => console.log("Erro ao reproduzir som:", err));

        const jogador = estadoJogo.jogadores[0]; // Jogador Humano
        jogador.pontos.push(valorCorretoRodada);
        jogador.total += valorCorretoRodada;
        atualizarPlacarInterface();

        // Feedback visual de acerto no painel de status
        const status = document.getElementById('status');
        status.innerHTML = `✨ Correto! +${valorCorretoRodada} ✨`;
        status.style.borderColor = '#27ae60';
        status.style.color = '#27ae60';
        status.style.transform = 'scale(1.1)';
        status.style.boxShadow = '0 6px 15px rgba(39, 174, 96, 0.3)';

        // Avança para a vez da CPU
        estadoJogo.jogadorAtual = 1;
        
        // Remove destaque ativo de turno temporariamente para focar no acerto
        const placarJ = document.getElementById('placar-jogador');
        if (placarJ) placarJ.classList.remove('placar-ativo');

        // Aguarda 1.8 segundos antes de iniciar o turno da CPU
        setTimeout(() => {
            // Restaura estilos padrão do status
            status.style.borderColor = '';
            status.style.color = '';
            status.style.transform = '';
            status.style.boxShadow = '';
            
            status.innerText = "CPU está jogando...";
            atualizarDestaquesPlacar();
            
            setTimeout(() => {
                lancarCPU();
            }, 1000);
        }, 1800);
    } else {
        // Resposta Incorreta!
        // Toca o som de erro
        somErro.play().catch(err => console.log("Erro ao reproduzir som:", err));

        // Faz o input tremer e brilhar em vermelho
        inputElement.classList.add('erro-animacao');
        
        setTimeout(() => {
            inputElement.classList.remove('erro-animacao');
        }, 400);

        inputElement.value = ''; // Limpa para digitar novamente
        inputElement.focus();
    }
}

/**
 * Captura o clique do Enter no campo de resposta
 */
function verificarTeclaEnter(event) {
    if (event.key === 'Enter') {
        confirmarResposta();
    }
}

/**
 * Disparado quando os 10 segundos acabam
 */
function mostrarTempoEsgotado() {
    clearInterval(temporizadorId);

    // Oculta a área de resposta
    document.getElementById('secao-resposta').style.display = 'none';

    const jogador = estadoJogo.jogadores[0];
    jogador.pontos.push(0);
    jogador.total += 0;
    atualizarPlacarInterface();

    // Mostra o resultado correto no overlay de tempo esgotado
    const subtitulo = document.getElementById('tempo-esgotado-subtitulo');
    if (subtitulo) {
        subtitulo.innerHTML = `Você não respondeu dentro dos 20 segundos.<br><br>A resposta correta era: <strong style="font-size: 24px; color: #e74c3c;">${valorCorretoRodada}</strong>`;
    }

    // Exibe o overlay de tempo esgotado
    document.getElementById('overlay-tempo-esgotado').style.display = 'flex';
}

/**
 * Executado ao clicar em "Continuar" no overlay de Tempo Esgotado
 */
function continuarAposTempoEsgotado() {
    // Esconde o overlay
    document.getElementById('overlay-tempo-esgotado').style.display = 'none';

    // Passa a vez para a CPU
    estadoJogo.jogadorAtual = 1;
    atualizarStatus();

    // Aciona a jogada automática da CPU
    const status = document.getElementById('status');
    status.innerText = "CPU está jogando...";
    
    setTimeout(() => {
        lancarCPU();
    }, 1200);
}

/**
 * Executa a jogada automática da CPU
 */
function lancarCPU() {
    const btn = document.getElementById('btn-lancar');

    const c = Math.floor(Math.random() * 6);
    const d = Math.floor(Math.random() * 6);
    const u = Math.floor(Math.random() * 6);

    desenharCubos('zona-c', c);
    desenharCubos('zona-d', d);
    desenharCubos('zona-u', u);

    const pontuacaoMatematica = (c * 100) + (d * 10) + u;

    const cpu = estadoJogo.jogadores[1]; // CPU
    cpu.pontos.push(pontuacaoMatematica);
    cpu.total += pontuacaoMatematica;

    setTimeout(() => {
        atualizarPlacarInterface();

        // Avança a rodada e volta a vez para o jogador humano
        estadoJogo.jogadorAtual = 0;
        estadoJogo.rodadaAtual++;

        atualizarStatus();

        // Se a partida não acabou, reabilita e exibe o botão para o usuário
        if (estadoJogo.rodadaAtual <= CONFIG.maxRodadas) {
            btn.style.display = 'inline-block';
            btn.disabled = false;
        }
    }, CONFIG.tempoAnimacao);
}

// Motor de Confetes em Canvas 2D
let animacaoConfeteId = null;
let redimensionarListener = null;

function iniciarConfetes() {
    const canvas = document.getElementById('canvas-confete');
    const ctx = canvas.getContext('2d');
    
    function redimensionarCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    redimensionarCanvas();
    
    // Remove listener antigo se existir para evitar múltiplos registros
    if (redimensionarListener) {
        window.removeEventListener('resize', redimensionarListener);
    }
    redimensionarListener = redimensionarCanvas;
    window.addEventListener('resize', redimensionarListener);

    const cores = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e84393', '#00cec9'];
    const quantidadeConfetes = 150;
    const confetes = [];

    // Criação dos confetes
    for (let i = 0; i < quantidadeConfetes; i++) {
        confetes.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight - 20,
            w: Math.random() * 8 + 6,
            h: Math.random() * 12 + 8,
            cor: cores[Math.floor(Math.random() * cores.length)],
            velocidadeY: Math.random() * 3 + 2,
            velocidadeX: Math.random() * 2 - 1,
            angulo: Math.random() * Math.PI,
            velocidadeRotacao: Math.random() * 0.05 + 0.02,
            oscilacao: Math.random() * 10,
            velocidadeOscilacao: Math.random() * 0.03 + 0.01
        });
    }

    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetes.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angulo);
            ctx.fillStyle = p.cor;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        atualizar();
    }

    function atualizar() {
        confetes.forEach(p => {
            p.y += p.velocidadeY;
            p.angulo += p.velocidadeRotacao;
            p.oscilacao += p.velocidadeOscilacao;
            p.x += Math.sin(p.oscilacao) + p.velocidadeX;

            // Reinicia confetes que saem da tela
            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
                p.velocidadeY = Math.random() * 3 + 2;
                p.velocidadeX = Math.random() * 2 - 1;
            }
        });
    }

    function loop() {
        desenhar();
        animacaoConfeteId = requestAnimationFrame(loop);
    }

    loop();
}

function pararConfetes() {
    if (animacaoConfeteId) {
        cancelAnimationFrame(animacaoConfeteId);
        animacaoConfeteId = null;
    }
    if (redimensionarListener) {
        window.removeEventListener('resize', redimensionarListener);
        redimensionarListener = null;
    }
    const canvas = document.getElementById('canvas-confete');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Gera o HTML de uma tabela contendo os pontos de cada rodada para um jogador
 */
function gerarTabelaPontosHTML(jogador) {
    let html = `<table class="tabela-rodadas">
        <thead>
            <tr>
                <th>Rodada</th>
                <th>Pontos</th>
            </tr>
        </thead>
        <tbody>`;
    for (let i = 0; i < CONFIG.maxRodadas; i++) {
        const pt = jogador.pontos[i] !== undefined ? jogador.pontos[i] : 0;
        html += `<tr>
            <td>${i + 1}ª</td>
            <td>${pt.toLocaleString('pt-PT')}</td>
        </tr>`;
    }
    html += `</tbody></table>`;
    return html;
}

/**
 * Executa a soma final das pontuações e aponta o ganhador do jogo
 */
function determinarVencedor() {
    // Oculta o botão de lançar na tela principal
    document.getElementById('btn-lancar').style.display = 'none';

    const status = document.getElementById('status');
    status.innerText = "Partida Concluída!";

    const j1 = estadoJogo.jogadores[0];
    const j2 = estadoJogo.jogadores[1];

    // Destaca o vencedor no placar superior
    const placarJ = document.getElementById('placar-jogador');
    const placarC = document.getElementById('placar-cpu');
    if (placarJ && placarC) {
        placarJ.classList.remove('vencedor-placar');
        placarC.classList.remove('vencedor-placar');
        if (j1.total > j2.total) {
            placarJ.classList.add('vencedor-placar');
        } else if (j2.total > j1.total) {
            placarC.classList.add('vencedor-placar');
        }
    }

    const overlay = document.getElementById('overlay-vitoria');
    const titulo = document.getElementById('vencedor-titulo');
    const subtitulo = document.getElementById('vencedor-subtitulo');
    const boxJ1 = document.getElementById('placar-box-j1');
    const boxJ2 = document.getElementById('placar-box-j2');

    // Preenche os nomes e pontos no placar do overlay
    document.getElementById('placar-j1-nome').innerText = j1.nome;
    document.getElementById('placar-j1-pontos').innerText = j1.total.toLocaleString('pt-PT');
    document.getElementById('placar-j2-nome').innerText = j2.nome;
    document.getElementById('placar-j2-pontos').innerText = j2.total.toLocaleString('pt-PT');

    // Preenche as tabelas de somas por rodada
    document.getElementById('tabela-j1-container').innerHTML = gerarTabelaPontosHTML(j1);
    document.getElementById('tabela-j2-container').innerHTML = gerarTabelaPontosHTML(j2);

    // Reseta destaques anteriores
    boxJ1.classList.remove('vencedor-placar');
    boxJ2.classList.remove('vencedor-placar');

    // Determina o ganhador e preenche as informações do overlay
    if (j1.total > j2.total) {
        titulo.innerText = `🏆 ${j1.nome} Venceu!`;
        subtitulo.innerText = `Parabéns pela vitória com ${j1.total.toLocaleString('pt-PT')} pontos!`;
        boxJ1.classList.add('vencedor-placar');
        
        // Toca o som de vitória
        somVitoria.play().catch(err => console.log("Erro ao reproduzir som:", err));
    } else if (j2.total > j1.total) {
        titulo.innerText = `🏆 ${j2.nome} Venceu!`;
        subtitulo.innerText = `Parabéns pela vitória com ${j2.total.toLocaleString('pt-PT')} pontos!`;
        boxJ2.classList.add('vencedor-placar');
    } else {
        titulo.innerText = `🤝 Empate Técnico!`;
        subtitulo.innerText = `Ambos os jogadores somaram ${j1.total.toLocaleString('pt-PT')} pontos.`;
    }

    // Exibe a tela final e inicia a festa de confetes
    overlay.style.display = 'flex';
    iniciarConfetes();
}

/**
 * Limpa o tabuleiro e reinicia todo o estado para recomeçar o jogo
 */
function reiniciarJogo() {
    clearInterval(temporizadorId);
    document.getElementById('secao-resposta').style.display = 'none';
    if (document.getElementById('overlay-tempo-esgotado')) {
        document.getElementById('overlay-tempo-esgotado').style.display = 'none';
    }

    // Interrompe e reseta o som de vitória caso esteja tocando
    somVitoria.pause();
    somVitoria.currentTime = 0;

    estadoJogo = {
        rodadaAtual: 1,
        jogadorAtual: 0,
        jogadores: [
            { nome: "Jogador", pontos: [], total: 0 },
            { nome: "CPU", pontos: [], total: 0 }
        ]
    };

    // Limpa visualmente as zonas de cubos
    desenharCubos('zona-c', 0);
    desenharCubos('zona-d', 0);
    desenharCubos('zona-u', 0);

    // Oculta a tela de vitória e para os confetes
    document.getElementById('overlay-vitoria').style.display = 'none';
    pararConfetes();

    // Exibe a tela de início novamente para re-cadastrar ou iniciar
    document.getElementById('overlay-inicio').style.display = 'flex';

    // Reseta os controladores de tela principal
    document.getElementById('btn-lancar').style.display = 'inline-block';
    document.getElementById('btn-lancar').disabled = false;

    // Reseta destaques e classes do placar
    const placarJ = document.getElementById('placar-jogador');
    const placarC = document.getElementById('placar-cpu');
    if (placarJ && placarC) {
        placarJ.className = 'placar-lado jogador';
        placarC.className = 'placar-lado cpu';
    }

    inicializarPlacar();
}

// Inicialização automática ao carregar a página
window.onload = inicializarPlacar;