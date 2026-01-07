/* =====================================================
   ESTADO GLOBAL E DETECÇÃO DE PÁGINA
===================================================== */

let modulos = [];
let moduloAtual = null;
let secaoAtual = 0;

// Detectar qual página estamos
const isModuloPage = window.location.pathname.includes('modulo.html');
const isIndexPage = !isModuloPage;

/* =====================================================
   TEMA (LIGHT/DARK)
===================================================== */

function configurarTema() {
    const temaSalvo = localStorage.getItem('theme') || 'light';
    aplicarTema(temaSalvo);
    
    // Criar ou configurar botão de tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', alternarTema);
        // Atualizar ícone baseado no tema
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = temaSalvo === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('theme', tema);
    
    // Atualizar ícone do botão
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = tema === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function alternarTema() {
    const temaAtual = document.documentElement.getAttribute('data-theme');
    const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
    aplicarTema(novoTema);
    mostrarToast(`Tema ${novoTema === 'dark' ? 'escuro' : 'claro'} ativado`);
}

/* =====================================================
   PÁGINA INICIAL (index.html)
===================================================== */

async function carregarModulos() {
    const container = document.getElementById('modules-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state__icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="empty-state__title">Carregando módulos...</div>
            <p>Aguarde um momento</p>
        </div>
    `;
    
    try {
        const response = await fetch('dados/modulos.json');
        if (!response.ok) throw new Error('Erro ao carregar módulos');
        
        modulos = await response.json();
        renderizarModulos();
        atualizarProgresso();
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="empty-state__title">Erro ao carregar</div>
                <p>Verifique sua conexão e tente novamente</p>
                <button class="btn btn--primary mt-3" onclick="carregarModulos()">
                    <i class="fas fa-redo"></i> Tentar novamente
                </button>
            </div>
        `;
    }
}

function renderizarModulos() {
    const container = document.getElementById('modules-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    modulos.forEach(modulo => {
        const card = document.createElement('div');
        card.className = 'card module-card card--interactive';
        
        // Determinar se está bloqueado
        const isBloqueado = modulo.status === 'bloqueado';
        const statusClass = `module-status--${modulo.status}`;
        
        card.innerHTML = `
            <div class="module-header">
                <div class="module-icon">
                    <i class="${modulo.icone}"></i>
                </div>
                <div class="module-title-container">
                    <h3 class="module-title">${modulo.titulo}</h3>
                    <p class="module-subtitle">${modulo.subtitulo}</p>
                </div>
                <span class="module-status ${statusClass}">
                    ${modulo.status === 'em_andamento' ? 'Em andamento' : 
                      modulo.status === 'bloqueado' ? 'Bloqueado' : 'Concluído'}
                </span>
            </div>
            
            <p class="module-description">${modulo.descricao}</p>
            
            <div class="module-footer">
                <div class="module-meta">
                    <span class="meta-item">
                        <i class="far fa-clock"></i> ${modulo.duracao}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-book-bible"></i> ${modulo.versiculoChave}
                    </span>
                </div>
                
                <button class="btn ${isBloqueado ? 'btn--ghost' : 'btn--primary'} btn-abrir-modulo">
                    ${isBloqueado ? 
                        '<i class="fas fa-lock"></i> Bloqueado' : 
                        '<i class="fas fa-play"></i> Iniciar módulo'}
                </button>
            </div>
        `;
        
        if (!isBloqueado) {
            card.querySelector('.btn-abrir-modulo').addEventListener('click', () => {
                abrirModulo(modulo);
            });
        }
        
        container.appendChild(card);
    });
}

function abrirModulo(modulo) {
    // Salvar o módulo selecionado
    localStorage.setItem('moduloSelecionado', JSON.stringify(modulo));
    // Redirecionar
    window.location.href = 'modulo.html';
}

function atualizarProgresso() {
    // Implementar lógica de progresso
    const modulosCompletos = modulos.filter(m => m.status === 'completed').length;
    const total = modulos.length;
    const porcentagem = total > 0 ? (modulosCompletos / total) * 100 : 0;
    
    const progressFill = document.getElementById('progress-fill');
    const completedCount = document.getElementById('completed-count');
    const totalModules = document.getElementById('total-modules');
    
    if (progressFill) {
        progressFill.style.width = `${porcentagem}%`;
        progressFill.textContent = `${Math.round(porcentagem)}%`;
    }
    
    if (completedCount) completedCount.textContent = modulosCompletos;
    if (totalModules) totalModules.textContent = total;
}

/* =====================================================
   PÁGINA DO MÓDULO (modulo.html)
===================================================== */

async function inicializarPaginaModulo() {
    configurarTema();
    await carregarModuloAtual();
    configurarNavegacao();
    configurarDiario();
    configurarMenuMobile();
}

async function carregarModuloAtual() {
    // Carregar módulo salvo
    const moduloSalvo = localStorage.getItem('moduloSelecionado');
    if (!moduloSalvo) {
        window.location.href = 'index.html';
        return;
    }
    
    moduloAtual = JSON.parse(moduloSalvo);
    
    // Atualizar título da página
    document.title = `${moduloAtual.titulo} - Discipulado Contemplativo`;
    
    // Atualizar header
    const tituloElement = document.getElementById('modulo-title');
    if (tituloElement) {
        tituloElement.textContent = moduloAtual.titulo;
    }
    
    // Carregar conteúdo do módulo específico
    try {
        const response = await fetch(`dados/modulo${moduloAtual.id}.json`);
        const dadosModulo = await response.json();
        
        // Atualizar com dados completos
        moduloAtual = { ...moduloAtual, ...dadosModulo };
        
        // Renderizar sidebar
        renderizarSidebar();
        
        // Carregar primeira seção
        carregarSecao(0);
        
        // Configurar botão de conclusão
        configurarBotaoConclusao();
        
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        mostrarErroModulo();
    }
}

function renderizarSidebar() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    if (!sidebarMenu || !moduloAtual.secoes) return;
    
    sidebarMenu.innerHTML = '';
    
    moduloAtual.secoes.forEach((secao, index) => {
        const li = document.createElement('li');
        li.className = 'sidebar-item';
        
        li.innerHTML = `
            <a href="#" class="sidebar-link ${index === 0 ? 'active' : ''}" data-index="${index}">
                <span class="sidebar-icon">
                    <i class="fas fa-chevron-right"></i>
                </span>
                <span class="sidebar-text">${secao.titulo}</span>
            </a>
        `;
        
        li.querySelector('.sidebar-link').addEventListener('click', (e) => {
            e.preventDefault();
            carregarSecao(index);
            atualizarMenuAtivo(index);
            
            // Fechar menu no mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.modulo-sidebar').classList.remove('active');
                document.querySelector('.sidebar-toggle').innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        sidebarMenu.appendChild(li);
    });
    
    // Adicionar item do diário
    const diarioLi = document.createElement('li');
    diarioLi.className = 'sidebar-item sidebar-item-diario';
    diarioLi.innerHTML = `
        <a href="#diario" class="sidebar-link sidebar-link-diario">
            <span class="sidebar-icon">
                <i class="fas fa-bookmark"></i>
            </span>
            <span class="sidebar-text">Meu Diário</span>
        </a>
    `;
    
    diarioLi.querySelector('.sidebar-link-diario').addEventListener('click', (e) => {
        e.preventDefault();
        abrirDiario();
    });
    
    sidebarMenu.appendChild(diarioLi);
}

function carregarSecao(index) {
    if (!moduloAtual || !moduloAtual.secoes || !moduloAtual.secoes[index]) return;
    
    secaoAtual = index;
    const secao = moduloAtual.secoes[index];
    const contentElement = document.getElementById('modulo-content');
    
    if (!contentElement) return;
    
    // Remover loading
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    
    // Carregar conteúdo
    contentElement.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">${secao.titulo}</h2>
            <div class="section-meta">
                <span class="section-number">${index + 1}/${moduloAtual.secoes.length}</span>
            </div>
        </div>
        <div class="section-content">
            ${secao.conteudo}
        </div>
        
        <div class="section-navigation">
            ${index > 0 ? `
                <button class="btn btn--ghost btn-secao-prev">
                    <i class="fas fa-arrow-left"></i> Seção anterior
                </button>
            ` : ''}
            
            ${index < moduloAtual.secoes.length - 1 ? `
                <button class="btn btn--primary btn-secao-next">
                    Próxima seção <i class="fas fa-arrow-right"></i>
                </button>
            ` : `
                <button class="btn btn--primary btn-completar-secao">
                    <i class="fas fa-check-circle"></i> Completar seção
                </button>
            `}
        </div>
    `;
    
    // Adicionar event listeners
    const prevBtn = contentElement.querySelector('.btn-secao-prev');
    const nextBtn = contentElement.querySelector('.btn-secao-next');
    const completarBtn = contentElement.querySelector('.btn-completar-secao');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => carregarSecao(index - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => carregarSecao(index + 1));
    }
    
    if (completarBtn) {
        completarBtn.addEventListener('click', () => {
            mostrarToast('Seção completada!', 'success');
        });
    }
}

function atualizarMenuAtivo(index) {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach((link, i) => {
        if (i === index) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function configurarNavegacao() {
    // Botões de navegação entre módulos
    const btnPrev = document.getElementById('btn-prev-modulo');
    const btnNext = document.getElementById('btn-next-modulo');
    
    if (btnPrev && moduloAtual.moduloAnterior) {
        btnPrev.addEventListener('click', () => {
            localStorage.setItem('moduloSelecionado', JSON.stringify({ id: moduloAtual.moduloAnterior }));
            window.location.reload();
        });
    } else if (btnPrev) {
        btnPrev.style.display = 'none';
    }
    
    if (btnNext && moduloAtual.proximoModulo) {
        btnNext.addEventListener('click', () => {
            localStorage.setItem('moduloSelecionado', JSON.stringify({ id: moduloAtual.proximoModulo }));
            window.location.reload();
        });
    } else if (btnNext) {
        btnNext.style.display = 'none';
    }
}

function configurarDiario() {
    const diarioLink = document.querySelector('.diario-link');
    const closeDiarioBtn = document.getElementById('btn-close-diario');
    
    if (!diarioLink || !closeDiarioBtn) return;
    
    // Carregar respostas salvas
    carregarDiarioSalvo();
    
    // Abrir diário
    diarioLink.addEventListener('click', (e) => {
        e.preventDefault();
        abrirDiario();
    });
    
    // Fechar diário
    closeDiarioBtn.addEventListener('click', fecharDiario);
    
    // Salvar diário
    const saveBtn = document.getElementById('btn-save-diario');
    const clearBtn = document.getElementById('btn-clear-diario');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', salvarDiario);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', limparDiario);
    }
}

function abrirDiario() {
    document.getElementById('modulo-diario').classList.add('active');
    document.getElementById('modulo-content').classList.add('hidden');
    document.querySelector('.modulo-sidebar').classList.remove('active');
}

function fecharDiario() {
    document.getElementById('modulo-diario').classList.remove('active');
    document.getElementById('modulo-content').classList.remove('hidden');
}

function carregarDiarioSalvo() {
    const moduloId = moduloAtual.id;
    const dados = localStorage.getItem(`diario_modulo_${moduloId}`);
    
    if (!dados) return;
    
    try {
        const respostas = JSON.parse(dados);
        for (let i = 1; i <= 4; i++) {
            const textarea = document.getElementById(`diario-pergunta${i}`);
            if (textarea && respostas[`p${i}`]) {
                textarea.value = respostas[`p${i}`];
            }
        }
    } catch (error) {
        console.error('Erro ao carregar diário:', error);
    }
}

function salvarDiario() {
    const moduloId = moduloAtual.id;
    const respostas = {};
    
    for (let i = 1; i <= 4; i++) {
        const textarea = document.getElementById(`diario-pergunta${i}`);
        if (textarea) {
            respostas[`p${i}`] = textarea.value;
        }
    }
    
    localStorage.setItem(`diario_modulo_${moduloId}`, JSON.stringify(respostas));
    
    // Mostrar feedback
    const message = document.getElementById('diario-saved-message');
    if (message) {
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 3000);
    }
    
    mostrarToast('Diário salvo com sucesso!', 'success');
}

function limparDiario() {
    if (confirm('Tem certeza que deseja limpar todas as respostas do diário?')) {
        for (let i = 1; i <= 4; i++) {
            const textarea = document.getElementById(`diario-pergunta${i}`);
            if (textarea) {
                textarea.value = '';
            }
        }
        mostrarToast('Diário limpo', 'info');
    }
}

function configurarBotaoConclusao() {
    const btn = document.getElementById('btn-mark-complete');
    const statusElement = document.getElementById('modulo-status');
    
    if (!btn || !statusElement) return;
    
    // Verificar se já está concluído
    const modulosConcluidos = JSON.parse(localStorage.getItem('modulosConcluidos') || '[]');
    const moduloId = moduloAtual.id;
    
    if (modulosConcluidos.includes(moduloId)) {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Concluído';
        btn.disabled = true;
        statusElement.textContent = 'Concluído';
        btn.classList.add('btn--success');
    }
    
    btn.addEventListener('click', () => {
        let concluidos = JSON.parse(localStorage.getItem('modulosConcluidos') || '[]');
        if (!concluidos.includes(moduloId)) {
            concluidos.push(moduloId);
            localStorage.setItem('modulosConcluidos', JSON.stringify(concluidos));
            
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Concluído';
            btn.disabled = true;
            statusElement.textContent = 'Concluído';
            btn.classList.add('btn--success');
            
            mostrarToast('Módulo concluído! Parabéns!', 'success');
            
            // Atualizar progresso na página inicial
            if (modulos) {
                const moduloIndex = modulos.findIndex(m => m.id === moduloId);
                if (moduloIndex !== -1) {
                    modulos[moduloIndex].status = 'completed';
                }
            }
        }
    });
}

function configurarMenuMobile() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.modulo-sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        toggleBtn.innerHTML = sidebar.classList.contains('active') 
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });
    
    // Fechar menu ao clicar fora (em mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

function mostrarErroModulo() {
    const contentElement = document.getElementById('modulo-content');
    if (!contentElement) return;
    
    contentElement.innerHTML = `
        <div class="empty-state">
            <div class="empty-state__icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-state__title">Erro ao carregar</div>
            <p>Não foi possível carregar o conteúdo deste módulo.</p>
            <div class="mt-4">
                <button class="btn btn--primary" onclick="window.location.href='index.html'">
                    <i class="fas fa-arrow-left"></i> Voltar para módulos
                </button>
            </div>
        </div>
    `;
}

/* =====================================================
   UTILITÁRIOS
===================================================== */

function mostrarToast(mensagem, tipo = 'success') {
    // Criar toast se não existir
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
        <div class="toast__icon">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast__message">${mensagem}</div>
        <button class="toast__close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toast.className = `toast toast--${tipo} show`;
    
    // Fechar toast
    toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.classList.remove('show');
    });
    
    // Auto-fechar
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (isModuloPage) {
        inicializarPaginaModulo();
    } else {
        configurarTema();
        carregarModulos();
    }
});