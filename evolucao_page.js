/* ============================================================
   evolucao_page.js - Logica da pagina "Minha Evolucao" (standalone)
   ============================================================ */

(function () {

    var btnGerar = document.getElementById('btn-gerar-evolucao');
    var btnLimpar = document.getElementById('btn-limpar-evolucao');
    var blocoResultados = document.getElementById('evolucao-resultados');

    var chartOIC01 = null;
    var chartOIC02 = null;
    var chartOIC03 = null;
    var chartOIC04 = null;
    var chartRadar = null;

    btnLimpar.addEventListener('click', function () {
        ['ev-cintura-passado', 'ev-flexao-passado', 'ev-abdominal-passado', 'ev-corrida-passado',
            'ev-cintura-atual', 'ev-flexao-atual', 'ev-abdominal-atual', 'ev-corrida-atual'].forEach(function (id) {
                document.getElementById(id).value = '';
            });
        blocoResultados.classList.add('oculto');
        destruirGraficos();
    });

    function lerNum(id, tipo) {
        var el = document.getElementById(id);
        if (!el) return null;
        var v = el.value.trim();
        if (v === '') return null;
        return tipo === 'int' ? parseInt(v, 10) : parseFloat(v);
    }

    btnGerar.addEventListener('click', function () {
        var dados = {
            passado: {
                cintura: lerNum('ev-cintura-passado', 'float'),
                flexao: lerNum('ev-flexao-passado', 'int'),
                abdominal: lerNum('ev-abdominal-passado', 'int'),
                corrida: lerNum('ev-corrida-passado', 'int')
            },
            atual: {
                cintura: lerNum('ev-cintura-atual', 'float'),
                flexao: lerNum('ev-flexao-atual', 'int'),
                abdominal: lerNum('ev-abdominal-atual', 'int'),
                corrida: lerNum('ev-corrida-atual', 'int')
            }
        };
        var temDados = dados.passado.cintura !== null || dados.passado.flexao !== null ||
            dados.passado.abdominal !== null || dados.passado.corrida !== null ||
            dados.atual.cintura !== null || dados.atual.flexao !== null ||
            dados.atual.abdominal !== null || dados.atual.corrida !== null;
        if (!temDados) { alert('Preencha pelo menos um campo para gerar os graficos.'); return; }
        var oicsConfig = [
            { id: 'cintura', key: 'cintura', invertido: true, unidade: 'cm', casas: 1 },
            { id: 'flexao', key: 'flexao', invertido: false, unidade: 'reps', casas: 0 },
            { id: 'abdominal', key: 'abdominal', invertido: false, unidade: 'reps', casas: 0 },
            { id: 'corrida', key: 'corrida', invertido: false, unidade: 'm', casas: 0 }
        ];
        oicsConfig.forEach(function (cfg) {
            renderOicCard(dados, cfg);
        });
        destruirGraficos();
        renderChartOIC('chart-oic01', dados.passado.cintura, dados.atual.cintura, 'cm', 'OIC01');
        renderChartOIC('chart-oic02', dados.passado.flexao, dados.atual.flexao, 'reps', 'OIC02');
        renderChartOIC('chart-oic03', dados.passado.abdominal, dados.atual.abdominal, 'reps', 'OIC03');
        renderChartOIC('chart-oic04', dados.passado.corrida, dados.atual.corrida, 'm', 'OIC04');
        renderChartRadar(dados);
        blocoResultados.classList.remove('oculto');
        setTimeout(function () { blocoResultados.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    });



    var COR_PASSADO_BG = 'rgba(124,58,237,0.65)', COR_PASSADO_BORDER = 'rgba(124,58,237,1)', COR_ATUAL_BG = 'rgba(5,150,105,0.65)', COR_ATUAL_BORDER = 'rgba(5,150,105,1)';

    function renderOicCard(dados, cfg) {
        var vP = dados.passado[cfg.key];
        var vA = dados.atual[cfg.key];
        var prefix = cfg.id;
        var badge = document.getElementById(prefix + '-badge-top');
        var cardsArea = document.getElementById(prefix + '-side-cards');
        if (!badge || !cardsArea) return;

        if (vP === null || vA === null) {
            badge.style.display = 'none';
            cardsArea.style.display = 'none';
            return;
        }
        badge.style.display = 'flex';
        cardsArea.style.display = 'flex';

        var delta = vA - vP;
        var melhorou = cfg.invertido ? delta < 0 : delta > 0;
        var neutro = delta === 0;

        badge.className = 'oic-status-badge ' + (neutro ? 'neutro' : (melhorou ? 'melhorou' : 'piorou'));
        if (cfg.invertido) {
            badge.innerHTML = neutro ? '<i class="fa-solid fa-minus"></i> Manteve' : (melhorou ? '<i class="fa-solid fa-arrow-down"></i> Melhorou' : '<i class="fa-solid fa-arrow-up"></i> Piorou');
        } else {
            badge.innerHTML = neutro ? '<i class="fa-solid fa-minus"></i> Manteve' : (melhorou ? '<i class="fa-solid fa-arrow-up"></i> Melhorou' : '<i class="fa-solid fa-arrow-down"></i> Piorou');
        }

        var varValue = document.getElementById(prefix + '-var-value');
        var varPct = document.getElementById(prefix + '-var-pct');
        var deltaVal = cfg.casas > 0 ? delta.toFixed(cfg.casas).replace('.', ',') : delta;
        if (cfg.key === 'corrida' && delta !== 0) deltaVal = delta.toLocaleString('pt-BR');
        var txtDelta = (delta > 0 ? '+' : '') + deltaVal + ' ' + cfg.unidade;

        var arrow = neutro ? '' : (delta > 0 ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>');
        varValue.innerHTML = arrow + ' ' + txtDelta;
        varValue.className = 'side-card-value ' + (neutro ? '' : (melhorou ? 'melhor' : 'pior'));

        if (vP !== 0) {
            var pct = Math.abs((delta / vP) * 100).toFixed(1).replace('.', ',');
            var txtMenorMaior = cfg.invertido ? (melhorou ? 'menor' : 'maior') : (melhorou ? 'maior' : 'menor');
            varPct.innerHTML = neutro ? '' : '(' + pct + '% ' + txtMenorMaior + ')';
        } else {
            varPct.innerHTML = '';
        }

        var statusCard = document.getElementById(prefix + '-status-card');
        var statusTitle = document.getElementById(prefix + '-status-title');
        var statusDesc = document.getElementById(prefix + '-status-desc');
        statusCard.className = 'oic-side-card status-card ' + (neutro ? 'neutro' : (melhorou ? 'melhorou' : 'piorou'));
        statusTitle.innerHTML = neutro ? '<i class="fa-solid fa-circle-info"></i> Manteve' : (melhorou ? '<i class="fa-solid fa-circle-check"></i> Melhorou' : '<i class="fa-solid fa-triangle-exclamation"></i> Piorou');
        statusDesc.innerHTML = neutro ? 'Manteve o mesmo resultado do último TACF.' : (delta > 0 ? 'Aumentou em relação ao último TACF.' : 'Reduziu em relação ao último TACF.');

        var valAnt = document.getElementById(prefix + '-val-ant');
        var valAtu = document.getElementById(prefix + '-val-atu');
        if (valAnt && valAtu) {
            var vP_txt = cfg.casas > 0 ? vP.toFixed(cfg.casas).replace('.', ',') : vP;
            var vA_txt = cfg.casas > 0 ? vA.toFixed(cfg.casas).replace('.', ',') : vA;
            if (cfg.key === 'corrida') { vP_txt = vP.toLocaleString('pt-BR'); vA_txt = vA.toLocaleString('pt-BR'); }
            valAnt.innerHTML = vP_txt + ' ' + cfg.unidade;
            valAtu.innerHTML = vA_txt + ' ' + cfg.unidade;
        }
    }

    function renderChartOIC(canvasId, vPassado, vAtual, unidade, key) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;

        var bgP = COR_PASSADO_BG, bdP = COR_PASSADO_BORDER;
        var bgA = COR_ATUAL_BG, bdA = COR_ATUAL_BORDER;
        var customPlugins = [];

        if (['OIC01', 'OIC02', 'OIC03', 'OIC04'].indexOf(key) !== -1) {
            bgP = '#94a3b8'; bdP = '#94a3b8';
            bgA = '#3b82f6'; bdA = '#3b82f6';
            customPlugins.push({
                id: 'oicLabels',
                afterDatasetsDraw: function (chart) {
                    var ctx = chart.ctx;
                    chart.data.datasets.forEach(function (dataset, i) {
                        var meta = chart.getDatasetMeta(i);
                        meta.data.forEach(function (bar, index) {
                            var data = dataset.data[index];
                            if (data !== null) {
                                ctx.fillStyle = '#1e3a8a';
                                ctx.font = 'bold 15px Inter';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                var txt = (key === 'OIC01') ? data.toFixed(1).replace('.', ',') : (key === 'OIC04' ? data.toLocaleString('pt-BR') : data);
                                txt += ' ' + unidade;
                                ctx.fillText(txt, bar.x, bar.y - 8);
                            }
                        });
                    });
                }
            });
        }

        var yScale = { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#64748b', callback: function (v) { return v + ' ' + unidade; } } };
        if (key === 'OIC01') {
            yScale.min = 0;
            yScale.max = 160;
        } else if (key === 'OIC02') {
            yScale.min = 0;
            yScale.max = 70;
        } else if (key === 'OIC03') {
            yScale.min = 0;
            yScale.max = 80;
        } else if (key === 'OIC04') {
            yScale.min = 1000;
            yScale.max = 4000;
        }

        var inst = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: { labels: ['TACF Anterior', 'TACF Atual'], datasets: [{ data: [vPassado, vAtual], backgroundColor: [bgP, bgA], borderColor: [bdP, bdA], borderWidth: 2, borderRadius: 8, borderSkipped: false }] },
            options: {
                responsive: true, maintainAspectRatio: false, layout: { padding: { top: 30 } },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var v = c.parsed.y; return v == null ? ' Sem dados' : ' ' + v + ' ' + unidade; } } } },
                scales: { x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12, weight: '600' }, color: '#475569' } }, y: yScale }
            },
            plugins: customPlugins
        });
        if (key === 'OIC01') chartOIC01 = inst; else if (key === 'OIC02') chartOIC02 = inst; else if (key === 'OIC03') chartOIC03 = inst; else if (key === 'OIC04') chartOIC04 = inst;
    }

    function renderChartRadar(dados) {
        var canvas = document.getElementById('chart-radar');
        if (!canvas) return;
        function norm(v, mn, mx) { return v === null ? null : Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100)); }
        function normC(v) { return v === null ? null : Math.max(0, Math.min(100, ((120 - v) / 50) * 100)); }
        chartRadar = new Chart(canvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Cintura', 'Flexao', 'Abdominal', 'Corrida'],
                datasets: [{ label: 'TACF Anterior', data: [normC(dados.passado.cintura), norm(dados.passado.flexao, 0, 60), norm(dados.passado.abdominal, 0, 70), norm(dados.passado.corrida, 1500, 3600)], backgroundColor: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.9)', pointBackgroundColor: 'rgba(124,58,237,1)', pointRadius: 5, borderWidth: 2.5 },
                { label: 'TACF Atual', data: [normC(dados.atual.cintura), norm(dados.atual.flexao, 0, 60), norm(dados.atual.abdominal, 0, 70), norm(dados.atual.corrida, 1500, 3600)], backgroundColor: 'rgba(5,150,105,0.2)', borderColor: 'rgba(5,150,105,0.9)', pointBackgroundColor: 'rgba(5,150,105,1)', pointRadius: 5, borderWidth: 2.5 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', weight: '600' }, padding: 16 } }, tooltip: { callbacks: { label: function (c) { var v = c.parsed.r; return v == null ? ' ' + c.dataset.label + ': -' : ' ' + c.dataset.label + ': ' + v.toFixed(1) + '/100'; } } } },
                scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { family: 'Inter', size: 10 }, color: '#94a3b8', backdropColor: 'transparent' }, grid: { color: 'rgba(0,0,0,0.08)' }, angleLines: { color: 'rgba(0,0,0,0.08)' }, pointLabels: { font: { family: 'Inter', size: 12, weight: '600' }, color: '#1e293b' } } }
            }
        });
    }

    function destruirGraficos() {
        if (chartOIC01) { chartOIC01.destroy(); chartOIC01 = null; }
        if (chartOIC02) { chartOIC02.destroy(); chartOIC02 = null; }
        if (chartOIC03) { chartOIC03.destroy(); chartOIC03 = null; }
        if (chartOIC04) { chartOIC04.destroy(); chartOIC04 = null; }
        if (chartRadar) { chartRadar.destroy(); chartRadar = null; }
    }

}());

