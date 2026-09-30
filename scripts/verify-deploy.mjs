#!/usr/bin/env node

/**
 * Script universal de validação pós-deploy de produção para JobPago.com.br.
 * Realiza fetch real contra URLs públicas e audita conteúdo byte-a-byte.
 */

const TARGETS = [
  {
    name: "Home - JobPago · renda na viagem",
    url: "https://www.jobpago.com.br/",
    expectedStatus: 200,
    mustContain: [
      "renda na viagem",
      "PIX COMBINADO DIRETO ENTRE AS PARTES",
      "Tenho um negócio",
      "Oferecer meu serviço",
      "Onde dormir",
      "Disque 100"
    ],
    mustNotContain: [
      // limpeza de escopo 2026-09-30: sem promessa de verificação/segurança
      "Refúgio da Estrada",
      "Noite segura",
      "não se compra",
      "Estou disponível",
      "Quanto se paga",
      "Anunciar Vaga",
      "Há 10 min",
      "Harley-Davidson",
      "Investidores 50+",
      "Escrow Imobiliário",
      "Serviços Secretos VIP 18+"
    ]
  },
  {
    name: "Rota Expurgo /secretos (Deve ser 404)",
    url: "https://www.jobpago.com.br/secretos",
    expectedStatus: 404,
    mustContain: [],
    mustNotContain: []
  },
  {
    name: "Termos e Privacidade",
    url: "https://www.jobpago.com.br/privacidade",
    expectedStatus: 200,
    mustContain: [
      "Política de Privacidade"
    ],
    mustNotContain: []
  },
  {
    name: "Área de Cadastro de Serviços & Leads LGPD (/cadastrar-servico)",
    url: "https://www.jobpago.com.br/cadastrar-servico",
    expectedStatus: 200,
    mustContain: [
      "Cadastro de Serviços",
      "Nós enviamos os serviços para o contratante",
      "Consentimento LGPD",
      "WhatsApp com DDD",
      "Declaro ter 18 anos ou mais"
    ],
    mustNotContain: []
  },
  {
    name: "Termos de Uso - 18+ e serviços proibidos (/termos)",
    url: "https://www.jobpago.com.br/termos",
    expectedStatus: 200,
    mustContain: [
      "maiores de 18 anos",
      "Serviços proibidos",
      "jobpago@allancandido.com"
    ],
    mustNotContain: ["allan@jobpago.com.br"]
  },
  {
    name: "Listagem pública de leads fechada (/api/leads GET)",
    url: "https://www.jobpago.com.br/api/leads",
    expectedStatus: 405,
    mustContain: [],
    mustNotContain: []
  },
  {
    name: "Blog Público & Ingestão de Artigos (/blog)",
    url: "https://www.jobpago.com.br/blog",
    expectedStatus: 200,
    mustContain: [
      "Blog",
      "JobPago"
    ],
    mustNotContain: []
  }
];

async function runVerification() {
  console.log("================================================================");
  console.log("🔍 AUDITORIA EXTERNA PÓS-DEPLOY: JOBPAGO.COM.BR");
  console.log("================================================================\n");

  let failures = 0;

  for (const target of TARGETS) {
    process.stdout.write(`👉 Verificando [${target.name}] (${target.url})... `);

    try {
      const resp = await fetch(target.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 DeployAuditor/2.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache"
        },
        redirect: "follow"
      });

      if (target.expectedStatus && resp.status !== target.expectedStatus) {
        console.log(`❌ FALHA HTTP: Status esperado ${target.expectedStatus}, mas retornou ${resp.status}!`);
        failures++;
        continue;
      }

      const body = await resp.text();

      // Checa strings obrigatórias
      let missingStr = null;
      for (const str of target.mustContain) {
        if (!body.toLowerCase().includes(str.toLowerCase())) {
          missingStr = str;
          break;
        }
      }

      if (missingStr) {
        console.log(`❌ FALHA DE CONTEÚDO: String obrigatória NÃO encontrada!`);
        console.log(`   Esperado encontrar: "${missingStr}"`);
        failures++;
        continue;
      }

      // Checa strings proibidas
      let foundForbidden = null;
      for (const str of target.mustNotContain) {
        if (body.toLowerCase().includes(str.toLowerCase())) {
          foundForbidden = str;
          break;
        }
      }

      if (foundForbidden) {
        console.log(`❌ FALHA DE CONTEÚDO: Conteúdo proibido/legado ENCONTRADO na página!`);
        console.log(`   Esperado NÃO encontrar: "${foundForbidden}"`);
        failures++;
        continue;
      }

      console.log("✅ APROVADO");
    } catch (err) {
      console.log(`❌ ERRO DE CONEXÃO: ${err.message}`);
      failures++;
    }
  }

  console.log("\n----------------------------------------------------------------");
  if (failures > 0) {
    console.error(`🚨 ERRO CRÍTICO: ${failures} verificação(ões) falharam no JobPago!`);
    console.error("O deploy NÃO foi concluído corretamente.");
    process.exit(1);
  } else {
    console.log("🎉 SUCESSO TOTAL: JobPago.com.br validado externamente com 100% de integridade!");
    process.exit(0);
  }
}

runVerification();
