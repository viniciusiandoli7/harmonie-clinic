# 🏛️ Harmonie Clinic - Sistema de Gestão de Luxo

O **Harmonie Clinic** é um ecossistema completo de gestão para clínicas de estética de alto padrão. Desenvolvido com uma estética "Mesa de Luz" minimalista e sofisticada, o sistema une gestão de pacientes (CRM), controle financeiro inteligente e um estúdio de criação de marketing impulsionado por IA.

## 🚀 Funcionalidades Principais

* **CRM de Pacientes:** Gestão completa de fichas, histórico de visitas, evolução clínica e prontuários digitais.
* **Inteligência Financeira (PDV):** Dashboard em tempo real com cálculo de lucro líquido, saldo em caixa, previsão de recebíveis e fechamento de vendas com divisão de comissões.
* **Marketing IA (Creative Studio):** Estúdio estilo "Canva" para criação de artes para redes sociais com suporte a geração de imagens por IA e editor drag-and-drop.
* **Contratos & Prontuários:** Sistema de geração de contratos HTML/PDF automáticos a partir de vendas, com suporte a assinatura digital via token.
* **Agenda Inteligente:** Controle de agendamentos com bloqueio de conflitos de horário e status de atendimento sincronizado com o financeiro.

---

## 🛠️ Tecnologias e Dependências

A aplicação foi construída utilizando as melhores e mais modernas ferramentas do mercado para garantir performance, escalabilidade e segurança:

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework Base** | Next.js (App Router), TypeScript |
| **Banco de Dados** | PostgreSQL (Neon.tech), Prisma ORM |
| **Estilização & UI** | Tailwind CSS, Framer Motion, Lucide Icons |
| **Autenticação** | NextAuth.js |
| **Marketing IA & Docs** | `html-to-image`, `jsPDF`, `html2canvas`, `dnd-kit` (Drag & Drop) |
| **Segurança & Validação** | Zod |

---

## 🏁 Como Rodar o Projeto

Siga os passos abaixo para configurar o ambiente localmente.

### 1. Pré-requisitos
* **[Node.js](https://nodejs.org/)** instalado (versão 18 ou superior).
* Uma instância de **PostgreSQL** (recomenda-se o [Neon.tech](https://neon.tech/) para o plano gratuito).
* Git instalado.

### 2. Instalação e Configuração
Clone o repositório e instale as dependências:

```bash
git clone [https://github.com/seu-usuario/harmonie-clinic.git](https://github.com/seu-usuario/harmonie-clinic.git)
cd harmonie-clinic
npm install