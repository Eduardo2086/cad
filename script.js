const chave = 'meusProdutos';
const EXTENSOES = ['png', 'jpg', 'jpeg', 'webp']; // extensões testadas ao carregar a imagem

let altId = null; // id do produto em edição (null = novo)



// ---------- localStorage ----------
function carregarRegistros() {
  const registros = localStorage.getItem(chave);
  return registros ? JSON.parse(registros) : [];
}

function salvarRegistros(registros) {
  localStorage.setItem(chave, JSON.stringify(registros));
}



// ---------- utilidades ----------
// Código aleatório de 4 caracteres (letras e números), sem repetir
function gerarCodigo(registros) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo;
  do {
    codigo = '';
    for (let i = 0; i < 4; i++) codigo += chars[Math.floor(Math.random() * chars.length)];
  } while (registros.some(r => r.codigo === codigo));
  return codigo;
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatarPreco(p) {
  return Number(p).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}



// Carrega img/<nome>.<ext> tentando as extensões até achar
function carregarImagem(img, nome) {
  nome = (nome || '').trim();
  if (!nome) { img.classList.add('hidden'); img.removeAttribute('src'); return; }
  let i = 0;
  img.onerror = () => {
    i++;
    if (i < EXTENSOES.length) img.src = `img/${nome}.${EXTENSOES[i]}`;
    else { img.classList.add('hidden'); img.onerror = null; }
  };
  img.onload = () => img.classList.remove('hidden');
  img.src = `img/${nome}.${EXTENSOES[0]}`;
}



// ---------- telas ----------
function mostrarTela(id) {
  ['telaCadastro', 'telaLista', 'telaExcluir'].forEach(t =>
    document.getElementById(t).classList.toggle('hidden', t !== id));
}

function renderizarTabela() {
  const tbody = document.querySelector('#tabelaProdutos tbody');
  tbody.innerHTML = '';

  const registros = carregarRegistros();
  if (registros.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Nenhum produto cadastrado</td></tr>';
    return;
  }

  registros.forEach(reg => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-foto"><img class="thumb hidden" alt="${escapeHtml(reg.nome)}"></td>
      <td class="cod">${escapeHtml(reg.codigo)}</td>
      <td>${escapeHtml(reg.nome)}</td>
      <td>${escapeHtml(reg.descricao)}</td>
      <td class="preco">R$ ${formatarPreco(reg.preco)}</td>
      <td class="acoes">
        <button data-id="${reg.id}" class="btn azul sm btn-editar">Editar</button>
        <button data-id="${reg.id}" class="btn verm sm btn-excluir">Excluir</button>
      </td>
    `;
    carregarImagem(tr.querySelector('img.thumb'), reg.foto);
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-editar').forEach(b =>
    b.addEventListener('click', e => carregarRegistroNoFormulario(e.currentTarget.dataset.id)));

  tbody.querySelectorAll('.btn-excluir').forEach(b =>
    b.addEventListener('click', e => telaExclusao(e.currentTarget.dataset.id)));
}



// ---------- cadastro / alteração ----------
function novoCadastro() {
  resetFormulario();
  document.getElementById('codigo').value = gerarCodigo(carregarRegistros());
  mostrarTela('telaCadastro');
}

function carregarRegistroNoFormulario(id) {
  const reg = carregarRegistros().find(r => r.id === id);
  if (!reg) { alert('Produto não encontrado.'); return; }

  altId = reg.id;
  document.getElementById('tituloForm').textContent = 'ALTERAÇÃO DE PRODUTO';
  document.getElementById('codigo').value = reg.codigo; // somente leitura
  document.getElementById('nome').value = reg.nome;
  document.getElementById('descricao').value = reg.descricao;
  document.getElementById('preco').value = reg.preco;
  document.getElementById('foto').value = reg.foto;
  document.getElementById('btnSalvar').textContent = 'Salvar alterações';
  document.getElementById('erro').textContent = '';
  carregarImagem(document.getElementById('imgPreview'), reg.foto);
  mostrarTela('telaCadastro');
}

function resetFormulario() {
  document.getElementById('formProduto').reset();
  altId = null;
  document.getElementById('tituloForm').textContent = 'CADASTRO DE PRODUTOS';
  document.getElementById('btnSalvar').textContent = 'Cadastrar Produto';
  document.getElementById('erro').textContent = '';
  carregarImagem(document.getElementById('imgPreview'), '');
}



// Retorna mensagem de erro ou '' se tudo ok
function validar(d) {
  if (!d.nome || !d.descricao || !d.preco || !d.foto) return 'Nenhum campo pode ficar vazio.';
  if (d.nome.length < 5) return 'O nome do produto deve ter pelo menos 5 caracteres.';
  if (!/^\d+([.,]\d{1,2})?$/.test(d.preco)) return 'O preço aceita apenas números (ex.: 12.50).';
  if (d.foto.length > 10) return 'O nome da imagem deve ter no máximo 10 caracteres.';
  return '';
}

function inserirRegistro(dados) {
  const registros = carregarRegistros();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  registros.push({ id, codigo: document.getElementById('codigo').value, ...dados });
  salvarRegistros(registros);
}

function atualizarRegistro(id, novosDados) {
  const registros = carregarRegistros();
  const idx = registros.findIndex(r => r.id === id);
  if (idx === -1) { alert('Produto para atualizar não foi encontrado.'); return; }
  registros[idx] = { ...registros[idx], ...novosDados }; // mantém id e código
  salvarRegistros(registros);
}



// ---------- exclusão ----------
function telaExclusao(id) {
  const reg = carregarRegistros().find(r => r.id === id);
  if (!reg) { alert('Produto não encontrado.'); return; }

  document.getElementById('detalheExcluir').innerHTML = `
    <div class="preview"><img id="imgExcluir" alt="" class="hidden"></div>
    <div>
      <p class="cod-grande"><strong>Código:</strong> ${escapeHtml(reg.codigo)}</p>
      <p><strong>Produto:</strong> ${escapeHtml(reg.nome)}</p>
      <p><strong>Descrição:</strong> ${escapeHtml(reg.descricao)}</p>
      <p><strong>Preço:</strong> R$ ${formatarPreco(reg.preco)}</p>
      <p><strong>Foto:</strong> ${escapeHtml(reg.foto)}</p>
    </div>
  `;
  carregarImagem(document.getElementById('imgExcluir'), reg.foto);
  mostrarTela('telaExcluir');



  // setTimeout deixa a tela desenhar antes do confirm
  setTimeout(() => {
    if (confirm('Deseja excluir o produto?')) {
      salvarRegistros(carregarRegistros().filter(r => r.id !== id));
    }
    renderizarTabela();
    mostrarTela('telaLista');
  }, 50);
}



// ---------- eventos ----------
document.getElementById('formProduto').addEventListener('submit', function (e) {
  e.preventDefault();
  const dados = {
    nome: document.getElementById('nome').value.trim(),
    descricao: document.getElementById('descricao').value.trim(),
    preco: document.getElementById('preco').value.trim().replace(',', '.'),
    foto: document.getElementById('foto').value.trim()
  };

  const erro = validar(dados);
  document.getElementById('erro').textContent = erro;
  if (erro) return;

  if (altId) atualizarRegistro(altId, dados);
  else inserirRegistro(dados);

  resetFormulario();
  renderizarTabela();
  mostrarTela('telaLista');
});

document.getElementById('btnCancelar').addEventListener('click', function () {
  resetFormulario();
  renderizarTabela();
  mostrarTela('telaLista');
});

document.getElementById('btnNovo').addEventListener('click', novoCadastro);



// Prévia da imagem ao digitar o nome (sem extensão)
document.getElementById('foto').addEventListener('input', function () {
  carregarImagem(document.getElementById('imgPreview'), this.value);
});



// ---------- inicialização ----------
renderizarTabela();
mostrarTela('telaLista');
