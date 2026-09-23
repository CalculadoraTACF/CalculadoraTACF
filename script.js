document.addEventListener('DOMContentLoaded', () => {
    const iconFlexaoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; color: var(--primary); margin-right: 4px;">
        <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" />
        <path d="M16 8 L9 12 L2 18" />
        <path d="M14 9 L14 18" />
        <path d="M10 11.5 L10 18" />
    </svg>`;

    const iconAbdominalSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; color: var(--primary); margin-right: 4px;">
        <circle cx="17.5" cy="8" r="2.5" fill="currentColor" stroke="none" />
        <path d="M16 11 L10 18 L5 12 L2 18" />
        <path d="M14 13 L8 13" />
    </svg>`;

    const form = document.getElementById('form-avaliacao');
    const resultPanel = document.getElementById('painel-resultados');

    const radioM = document.getElementById('gen-masc');
    const radioF = document.getElementById('gen-fem');

    const idadeInput = document.getElementById('idade');
    const idadeError = document.getElementById('erro-idade');

    const toggleMarcha = document.getElementById('chave-marcha');
    const corridaGroup = document.getElementById('grupo-corrida');
    const marchaGroup = document.getElementById('grupo-marcha');

    const labelCintura = document.getElementById('nome-cintura');
    const labelFlexao = document.getElementById('nome-flexao');
    const labelAbdominal = document.getElementById('nome-abdominal');
    const labelAerobico = document.getElementById('nome-aerobico');
    const flexaoInfo = document.getElementById('info-flexao');

    const corridaInput = document.getElementById('corrida');
    const marchaMinInput = document.getElementById('marcha-min');
    const marchaSegInput = document.getElementById('marcha-seg');

    const getSexo = () => radioM.checked ? 'M' : 'F';

    atualizarLabelsOIC();

    radioM.addEventListener('change', atualizarLabelsOIC);
    radioF.addEventListener('change', atualizarLabelsOIC);

    idadeInput.addEventListener('input', () => {
        const idade = parseInt(idadeInput.value);
        if (idade < 17 || idade > 70) {
            idadeError.style.display = 'block';
            idadeError.innerText = 'Fora do intervalo permitido.';
            idadeInput.setCustomValidity('Idade fora do intervalo permitido (17-70).');
        } else {
            idadeError.style.display = 'none';
            idadeInput.setCustomValidity('');
        }
    });

    toggleMarcha.addEventListener('change', (e) => {
        const isMarcha = e.target.checked;
        if (isMarcha) {
            corridaGroup.classList.add('oculto');
            marchaGroup.classList.remove('oculto');

            corridaInput.removeAttribute('required');
            marchaMinInput.setAttribute('required', 'true');
            marchaSegInput.setAttribute('required', 'true');
        } else {
            corridaGroup.classList.remove('oculto');
            marchaGroup.classList.add('oculto');

            corridaInput.setAttribute('required', 'true');
            marchaMinInput.removeAttribute('required');
            marchaSegInput.removeAttribute('required');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const idade = parseInt(idadeInput.value);
        if (idade < 17 || idade > 70) {
            alert('Idade deve ser entre 17 e 70 anos.');
            return;
        }

        const isMarcha = toggleMarcha.checked;
        const formData = {
            estatura: parseInt(document.getElementById('estatura').value),
            cintura: parseFloat(document.getElementById('cintura').value),
            flexao: parseInt(document.getElementById('flexao').value),
            abdominal: parseInt(document.getElementById('abdominal').value),
            isMarcha: isMarcha,
            corrida: isMarcha ? 0 : parseInt(corridaInput.value),
            marchaMin: isMarcha ? parseInt(marchaMinInput.value) || 0 : 0,
            marchaSeg: isMarcha ? parseInt(marchaSegInput.value) || 0 : 0,
        };

        const sexo = getSexo();

        const resultado = avaliarDesempenho(sexo, idade, formData);

        exibirResultado(resultado, sexo);
    });

    document.getElementById('btn-reiniciar').addEventListener('click', () => {
        form.reset();
        atualizarLabelsOIC();

        toggleMarcha.checked = false;
        toggleMarcha.dispatchEvent(new Event('change'));

        resultPanel.classList.add('oculto');
        form.style.display = 'block';

        document.getElementById('card-imc').style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let lastAvaliacao = null;

    function atualizarLabelsOIC() {
        if (getSexo() === 'M') {
            labelCintura.innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> OIC 01 - Cintura';
            labelFlexao.innerHTML = iconFlexaoSVG + ' OIC 02 - Flexão';
            labelAbdominal.innerHTML = iconAbdominalSVG + ' OIC 03 - Abdominal';
            labelAerobico.innerHTML = '<i class="fa-solid fa-person-running"></i> OIC 04 - Capacidade Aeróbica';
            flexaoInfo.innerText = "Apoio de frente sobre o solo, sem pausa.";
        } else {
            labelCintura.innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> OIC 05 - Cintura (Fem)';
            labelFlexao.innerHTML = iconFlexaoSVG + ' OIC 06 - Flexão (Fem)';
            labelAbdominal.innerHTML = iconAbdominalSVG + ' OIC 07 - Abdominal (Fem)';
            labelAerobico.innerHTML = '<i class="fa-solid fa-person-running"></i> OIC 08 - Capacidade Aeróbica (Fem)';
            flexaoInfo.innerText = "Apoio de frente sobre o solo, sem pausa (Art. 108 da NSCA 54-3)";
        }
    }

    const nomeGrau = {
        'E': 'Excelente',
        'MB': 'Muito Bom',
        'B': 'Bom',
        'S': 'Satisfatório',
        'I': 'Insatisfatório'
    };

    const valorGrau = { 'I': 0, 'S': 1, 'B': 2, 'MB': 3, 'E': 4 };


    function renderSit(grau, proximo, falta, unidade) {
        const statusClassMap = {
            'E': 'nivel-e',
            'MB': 'nivel-mb',
            'B': 'nivel-b',
            'S': 'nivel-r',
            'I': 'nivel-i'
        };

        let statusDesc = "Nível máximo (E)";
        if (proximo && falta > 0) {
            let faltaStr = falta;
            if (unidade === 's' && falta >= 60) {
                const m = Math.floor(falta / 60);
                const s = falta % 60;
                faltaStr = s > 0 ? `${m}m ${s}s` : `${m}m`;
            } else {
                faltaStr = `${falta} ${unidade}`;
            }
            statusDesc = `Faltam ${faltaStr} para ${proximo}`;
        }

        return `
            <div class="nivel ${statusClassMap[grau]}">${grau} - ${nomeGrau[grau]}</div>
            <div class="desc-nivel">${statusDesc}</div>
        `;
    }


    function exibirResultado(resultData, sexo) {
        const isFem = sexo === 'F';

        document.getElementById('saida-cint-tit').innerText = isFem ? 'OIC 05 - Cintura' : 'OIC 01 - Cintura';
        document.getElementById('saida-flex-tit').innerText = isFem ? 'OIC 06 - Flexão de braços' : 'OIC 02 - Flexão de braços';
        document.getElementById('saida-abd-tit').innerText = isFem ? 'OIC 07 - Abdominal' : 'OIC 03 - Abdominal';
        document.getElementById('saida-aer-tit').innerText = isFem ? 'OIC 08 - Aeróbico' : 'OIC 04 - Aeróbico';

        const sufixoIcone = isFem ? '-f' : '-m';
        document.getElementById('foto-cint').src = `images/icone-cintura${sufixoIcone}.png`;
        document.getElementById('foto-flex').src = `images/icone-flexao${sufixoIcone}.png`;
        document.getElementById('foto-abd').src = `images/icone-abdominal${sufixoIcone}.png`;
        document.getElementById('foto-aer').src = `images/icone-aerobico${sufixoIcone}.png`;

        document.getElementById('saida-cint-val').innerHTML = `${resultData.cintura.valor.replace(' cm', '')} <small>cm</small>`;
        document.getElementById('saida-cint-sit').innerHTML = renderSit(resultData.cintura.grau, resultData.cintura.proximo, resultData.cintura.falta, 'cm');
        document.getElementById('saida-cint-pts').innerText = resultData.cintura.pontos;

        document.getElementById('saida-flex-val').innerHTML = `${resultData.flexao.valor.replace(' reps', '')} <small>reps</small>`;
        document.getElementById('saida-flex-sit').innerHTML = renderSit(resultData.flexao.grau, resultData.flexao.proximo, resultData.flexao.falta, 'reps');
        document.getElementById('saida-flex-pts').innerText = resultData.flexao.pontos;

        document.getElementById('saida-abd-val').innerHTML = `${resultData.abdominal.valor.replace(' reps', '')} <small>reps/min</small>`;
        document.getElementById('saida-abd-sit').innerHTML = renderSit(resultData.abdominal.grau, resultData.abdominal.proximo, resultData.abdominal.falta, 'reps');
        document.getElementById('saida-abd-pts').innerText = resultData.abdominal.pontos;

        const isMarcha = resultData.aerobico.valor.includes('m') && resultData.aerobico.valor.includes('s');
        const aeroUnidade = isMarcha ? 's' : 'm';
        document.getElementById('saida-aer-val').innerHTML = `${resultData.aerobico.valor.replace(' m', '')} <small>${aeroUnidade === 's' ? '' : 'm'}</small>`;
        document.getElementById('saida-aer-sit').innerHTML = renderSit(resultData.aerobico.grau, resultData.aerobico.proximo, resultData.aerobico.falta, aeroUnidade);
        document.getElementById('saida-aer-pts').innerText = resultData.aerobico.pontos;

        let somatorio = 0;
        let temPontos = true;

        const ptsCintura = parseFloat(resultData.cintura.pontos);
        const ptsFlexao = parseFloat(resultData.flexao.pontos);
        const ptsAbdominal = parseFloat(resultData.abdominal.pontos);
        const ptsAerobico = parseFloat(resultData.aerobico.pontos);

        if (isNaN(ptsCintura) || isNaN(ptsFlexao) || isNaN(ptsAbdominal) || isNaN(ptsAerobico)) {
            temPontos = false;
        } else {
            somatorio = ptsCintura + ptsFlexao + ptsAbdominal + ptsAerobico;
        }

        if (temPontos) {
            document.getElementById('val-somatoria').innerHTML = `${somatorio.toFixed(1)} <small>/ 100</small>`;

            let globalLetra = '--';
            let globalNome = '--';
            if (somatorio >= 90) { globalLetra = 'E'; globalNome = 'Excelente'; }
            else if (somatorio >= 70) { globalLetra = 'MB'; globalNome = 'Muito Bom'; }
            else if (somatorio >= 40) { globalLetra = 'B'; globalNome = 'Bom'; }
            else if (somatorio >= 20) { globalLetra = 'S'; globalNome = 'Satisfatório'; }
            else { globalLetra = 'I'; globalNome = 'Insatisfatório'; }

            document.getElementById('conceito-sigla').innerText = globalLetra;
            document.getElementById('conceito-descricao').innerHTML = `Conceituação Global: <span id="conceito-label">${globalNome}</span>`;

            document.getElementById('card-conceito').className = `conceito-global cartao-${globalLetra}`;


            const selectMeta = document.getElementById('sel-objetivo');
            selectMeta.value = (globalLetra === 'I') ? 'S' : globalLetra;
        } else {
            document.getElementById('val-somatoria').innerHTML = `-- <small>/ 100</small>`;

            document.getElementById('conceito-sigla').innerText = '--';
            document.getElementById('conceito-descricao').innerHTML = `Conceituação Global: <span id="conceito-label">--</span>`;
            document.getElementById('card-conceito').className = 'conceito-global';
        }



        const minGrauValue = Math.min(
            valorGrau[resultData.cintura.grau],
            valorGrau[resultData.flexao.grau],
            valorGrau[resultData.abdominal.grau],
            valorGrau[resultData.aerobico.grau]
        );

        const badge = document.getElementById('indicador-final');
        if (minGrauValue === 0) {
            badge.innerText = 'INAPTO (I)';
            badge.className = 'selo-inapto';
        } else {
            badge.innerText = 'APTO (A)';
            badge.className = 'selo-apto';
        }


        const imcCard = document.getElementById('card-imc');
        const pesoVal = parseFloat(document.getElementById('peso').value);
        const altCm = parseInt(document.getElementById('estatura').value);

        if (pesoVal > 0 && altCm > 0) {
            const altM = altCm / 100;
            const imc = pesoVal / (altM * altM);

            document.getElementById('imc-valor').textContent = imc.toFixed(1);

            let classif = '', badgeClass = '', pct = 0;
            if (imc < 18.5) {
                classif = 'Magreza'; badgeClass = 'imc-badge-magro';
                pct = Math.max((imc / 18.5) * 20, 1);
            } else if (imc < 25) {
                classif = 'Peso Normal'; badgeClass = 'imc-badge-normal';
                pct = 20 + ((imc - 18.5) / 6.5) * 20;
            } else if (imc < 30) {
                classif = 'Sobrepeso'; badgeClass = 'imc-badge-sobre';
                pct = 40 + ((imc - 25) / 5) * 20;
            } else if (imc < 40) {
                classif = 'Obesidade'; badgeClass = 'imc-badge-obeso';
                pct = 60 + ((imc - 30) / 10) * 20;
            } else {
                classif = 'Obesidade Grave'; badgeClass = 'imc-badge-grave';
                pct = 80 + Math.min(((imc - 40) / 15) * 20, 18);
            }

            const badge = document.getElementById('imc-badge');
            badge.textContent = classif;
            badge.className = 'imc-classif-badge ' + badgeClass;

            document.getElementById('imc-marcador').style.left = Math.min(pct, 98) + '%';

            imcCard.style.display = 'block';
        } else {
            imcCard.style.display = 'none';
        }


        lastAvaliacao = {
            resultData, sexo, formData: {
                idade: parseInt(document.getElementById('idade').value),
                estatura: parseInt(document.getElementById('estatura').value),
                cintura: parseFloat(document.getElementById('cintura').value),
                flexao: parseInt(document.getElementById('flexao').value),
                abdominal: parseInt(document.getElementById('abdominal').value),
                corrida: parseInt(document.getElementById('corrida').value),
                isMarcha: resultData.aerobico.valor.includes('s'),
                tempoMarcha: resultData.aerobico.valor.includes('s') ? (parseInt(document.getElementById('marcha-min').value) * 60 + parseInt(document.getElementById('marcha-seg').value)) : 0
            }
        };
        renderMetas();

        resultPanel.classList.remove('oculto');
        resultPanel.scrollIntoView({ behavior: 'smooth' });
    }


    function formatarSegundos(s) {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
    }

    function renderMetas() {
        if (!lastAvaliacao) return;

        const { resultData, sexo, formData } = lastAvaliacao;
        const metaGrau = document.getElementById('sel-objetivo').value;
        const container = document.getElementById('corpo-metas');

        const isFem = sexo === 'F';
        const table = TACF_TABLES[sexo];

        const metas = [
            { id: isFem ? 'OIC 05' : 'OIC 01', nome: 'Cintura', key: 'cintura', curVal: resultData.cintura.valor, table: table.cintura, param: formData.estatura, unidade: 'cm', format: (v) => `${v} cm` },
            { id: isFem ? 'OIC 06' : 'OIC 02', nome: 'Flexão de braços', key: 'flexao', curVal: resultData.flexao.valor, table: table.flexao, param: formData.idade, unidade: 'reps', format: (v) => `${v} reps` },
            { id: isFem ? 'OIC 07' : 'OIC 03', nome: 'Abdominal', key: 'abdominal', curVal: resultData.abdominal.valor, table: table.abdominal, param: formData.idade, unidade: 'reps', format: (v) => `${v} reps` },
        ];

        if (formData.isMarcha) {
            metas.push({ id: isFem ? 'OIC 08' : 'OIC 04', nome: 'Aeróbico (Marcha)', key: 'aerobico', curVal: resultData.aerobico.valor, table: table.marcha, param: formData.idade, unidade: 's', format: (v) => formatarSegundos(v) });
        } else {
            metas.push({ id: isFem ? 'OIC 08' : 'OIC 04', nome: 'Aeróbico', key: 'aerobico', curVal: resultData.aerobico.valor, table: table.corrida, param: formData.idade, unidade: 'm', format: (v) => `${v} m` });
        }

        const valorMetaValue = valorGrau[metaGrau];
        const nomeGrau = { S: 'Satisfatório', B: 'Bom', MB: 'Muito Bom', E: 'Excelente' };
        const iconeOIC = { cintura: '📏', flexao: '💪', abdominal: '🔥', aerobico: '🏃' };

        let html = '';

        metas.forEach(m => {
            const curGrau = resultData[m.key].grau;
            const curGrauValue = valorGrau[curGrau];
            const isMet = curGrauValue >= valorMetaValue;

            const req = obterMeta(m.table, m.param, metaGrau);
            let reqStr = '--';
            let reqDiffStr = '';
            if (req) {
                reqStr = m.format(req.limit) + (req.type === 'higher' ? ' ou mais' : ' ou menos');

                // calcula quanto falta para a meta
                let curRawMeta = 0;
                if (m.key === 'cintura') curRawMeta = parseFloat(m.curVal.replace(' cm', ''));
                else if (m.key === 'flexao' || m.key === 'abdominal') curRawMeta = parseInt(m.curVal.replace(' reps', ''));
                else if (m.key === 'aerobico' && m.curVal.includes(' m')) curRawMeta = parseInt(m.curVal.replace(' m', ''));
                else if (m.key === 'aerobico' && m.curVal.includes('s')) {
                    const pts = m.curVal.split('m');
                    curRawMeta = pts.length === 2
                        ? parseInt(pts[0]) * 60 + parseInt(pts[1].replace('s', ''))
                        : parseInt(m.curVal.replace('m', '')) * 60;
                }

                const metaDiff = req.type === 'higher'
                    ? req.limit - curRawMeta
                    : curRawMeta - req.limit;

                if (metaDiff > 0) {
                    let metaDiffText = '';
                    if (m.key === 'flexao' || m.key === 'abdominal') metaDiffText = `${metaDiff} reps`;
                    else if (m.key === 'cintura') metaDiffText = `${metaDiff.toFixed(1)} cm`;
                    else if (m.key === 'aerobico') metaDiffText = req.type === 'lower' ? formatarSegundos(metaDiff) : `${metaDiff} m`;
                    reqDiffStr = `Faltam ${metaDiffText}`;
                }
            }

            const oicKeyToUse = m.key === 'aerobico' ? (formData.isMarcha ? 'marcha' : 'corrida') : m.key;
            const reqE = obterValorMaximosPontos(sexo, oicKeyToUse, m.param);
            let reqEStr = '--';
            let diffStr = '';

            if (reqE) {
                let curRaw = 0;
                if (m.key === 'cintura') curRaw = parseFloat(m.curVal.replace(' cm', ''));
                else if (m.key === 'flexao' || m.key === 'abdominal') curRaw = parseInt(m.curVal.replace(' reps', ''));
                else if (m.key === 'corrida') curRaw = parseInt(m.curVal.replace(' m', ''));
                else if (m.key === 'aerobico' && m.curVal.includes('m')) {
                    curRaw = parseInt(m.curVal.replace(' m', ''));
                }
                else if (m.key === 'aerobico' && m.curVal.includes('s')) {
                    const parts = m.curVal.split('m');
                    let seg = 0;
                    if (parts.length === 2) {
                        seg = parseInt(parts[0]) * 60 + parseInt(parts[1].replace('s', ''));
                    } else {
                        seg = parseInt(m.curVal.replace('m', '')) * 60;
                    }
                    curRaw = seg;
                }

                if (curRaw || curRaw === 0) {
                    if (reqE.type === 'higher') {
                        let diff = reqE.limit - curRaw;
                        if (diff > 0) {
                            const qtd = m.key === 'aerobico' && reqE.limit > 1000 ? diff : m.format(diff).replace(' reps', '');
                            const unid = m.key === 'flexao' || m.key === 'abdominal' ? 'reps' : (m.key === 'cintura' ? 'cm' : (m.key === 'aerobico' && reqE.limit > 1000 ? 'm' : 's'));
                            diffStr = `Faltam ${qtd} ${unid} para Pontuação Máxima`;
                        } else {
                            diffStr = 'Pontuação Máxima Atingida';
                        }
                    } else {
                        let diff = curRaw - reqE.limit;
                        if (diff > 0) {
                            if (m.key === 'aerobico' && reqE.limit > 100) {
                                diffStr = `Faltam baixar ${formatarSegundos(diff)} para Pontuação Máxima`;
                            } else {
                                diffStr = `Faltam baixar ${diff.toFixed(1)} cm para Pontuação Máxima`;
                            }
                        } else {
                            diffStr = 'Pontuação Máxima Atingida';
                        }
                    }
                }
                reqEStr = m.format(reqE.limit) + (reqE.type === 'higher' ? ' ou mais' : ' ou menos');
            }

            const isMaximo = diffStr.includes('Pontuação Máxima Atingida');
            const diffClass = isMaximo ? 'meta-diff-ok' : 'meta-diff-falta';
            const badgeClass = isMet ? 'meta-badge-ok' : 'meta-badge-falta';
            const badgeText = isMet ? '✅ Meta atingida' : '⚠️ Precisa melhorar';

            html += `
            <div class="meta-card">
                <div class="meta-card-header">
                    <div class="meta-card-header-left">
                        <div class="meta-card-id-row">
                            <div class="meta-card-id">${m.id}</div>
                            <div class="meta-card-nome">${m.nome.replace(' (Marcha)', '')}</div>
                        </div>
                        <span class="meta-badge ${badgeClass}">${badgeText}</span>
                    </div>
                </div>
                <div class="meta-card-body">
                    <div class="meta-stat">
                        <div class="meta-stat-label">Resultado Atual</div>
                        <div class="meta-stat-valor">${m.curVal}</div>
                    </div>
                    <div class="meta-stat">
                        <div class="meta-stat-label">Meta: ${nomeGrau[metaGrau]}</div>
                        <div class="meta-stat-valor meta-stat-meta">
                            ${reqStr}
                            ${reqDiffStr ? `<div class="meta-req-diff">(${reqDiffStr})</div>` : ''}
                        </div>
                    </div>
                    <div class="meta-stat">
                        <div class="meta-stat-label">Pontuação Máxima</div>
                        <div class="meta-stat-valor">${reqEStr}</div>
                    </div>
                </div>
                ${diffStr ? `<div class="meta-card-diff ${diffClass}">${diffStr}</div>` : ''}
            </div>`;
        });

        container.innerHTML = html;
        atualizarThMeta(metaGrau);
    }

    function atualizarThMeta(grau) {
        const thLabel = document.getElementById('cabec-minimo');
        if (!thLabel) return;
        const nomeCompleto = {
            'S': 'Satisfatório (S)',
            'B': 'Bom (B)',
            'MB': 'Muito Bom (MB)',
            'E': 'Excelente (E)'
        };
        thLabel.innerText = `Valor Mínimo Necessário para ${nomeCompleto[grau] || grau}`;
    }

    document.getElementById('sel-objetivo').addEventListener('change', renderMetas);


    function statusIcon(isApto) {
        return isApto
            ? '<i class="fa-solid fa-circle-check" style="color: var(--accent); margin-left: 8px;"></i>'
            : '<i class="fa-solid fa-circle-xmark" style="color: var(--danger); margin-left: 8px;"></i>';
    }
});
