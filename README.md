# 🏛️ Harmonie Clinic - Sistema de Gestão de Luxo

O **Harmonie Clinic** é um ecossistema completo de gestão para clínicas de estética de alto padrão. Desenvolvido com uma estética "Mesa de Luz" minimalista e sofisticada, o sistema une gestão de pacientes (CRM), controle financeiro inteligente e um estúdio de criação de marketing impulsionado por IA.

## 🚀 Funcionalidades Principais

* **CRM de Pacientes:** Gestão completa de fichas, histórico de visitas, evolução clínica e prontuários digitais.
* **Inteligência Financeira:** Dashboard em tempo real com cálculo de lucro líquido, saldo em caixa e previsão de recebíveis.
* **Marketing IA (Creative Studio):** Estúdio estilo "Canva" para criação de artes para redes sociais com suporte a geração de imagens por IA e editor drag-and-drop.
* **Prontuários & Termos:** Sistema de geração de documentos clínicos com suporte a assinatura digital e histórico de procedimentos.
* **Agenda Inteligente:** Controle de agendamentos e status de atendimento sincronizados com o financeiro.

## 🛠️ Tech Stack

* **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS & Lucide Icons
* **Banco de Dados:** PostgreSQL (via [Neon.tech](https://neon.tech/))
* **ORM:** Prisma
* **Exportação:** `html-to-image` para o Studio de Marketing

## 🏁 Como Rodar o Projeto

Siga os passos abaixo para configurar o ambiente localmente.

### 1. Pré-requisitos
* Node.js instalado (versão 18 ou superior).
* Uma instância de PostgreSQL (recomendo o Neon.tech para o plano gratuito).

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone [https://github.com/seu-usuario/harmonie-clinic.git](https://github.com/seu-usuario/harmonie-clinic.git)
cd harmonie-clinic
npm install

## 🛠️ Tecnologias e Dependências

A aplicação foi construída utilizando as melhores ferramentas do mercado para garantir performance e escalabilidade:

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework** | Next.js 16, TypeScript |
| **Banco de Dados** | Prisma ORM, PostgreSQL (Neon.tech) |
| **Estilização** | Tailwind CSS, Framer Motion, Lucide Icons |
| **Marketing IA** | html-to-image, dnd-kit (Drag and Drop) |
| **Documentação** | jsPDF, html2canvas |
| **Segurança** | Zod (Validação de dados) |

*Variáveis de ambiente*
Crie um arquivo .env na raiz do projeto e adicione sua stringe de conexão do banco de dados

DATABASE_URL="postgresql://usuario:senha@host/dbname?sslmode=require"

*Configuração do banco de dados*
npx prisma generate
npx prisma db push

npm run dev