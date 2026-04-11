type ContractItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  observation?: string; 
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
}

const TREATMENT_TEXTS: Record<string, string> = {
  "ULTRASSOM MICRO E MACROFOCADO": `
    <b>Ultrassom micro e macrofocado</b><br/>
    O ultrassom micro e macrofocado é um procedimento estético não invasivo indicado para o tratamento da flacidez facial e corporal, melhora do contorno, estímulo profundo de colágeno e sustentação dos tecidos.<br/>
    Atua por meio de ondas de ultrassom focalizadas que atingem diferentes profundidades da pele, incluindo derme profunda e camada músculo-aponeurótica superficial (SMAS), promovendo contração imediata das fibras e estímulo de neocolagênese progressiva.<br/>
    Os resultados são graduais e cumulativos, com melhora progressiva entre 60 e 90 dias, podendo durar até 12 meses, conforme resposta individual e hábitos do paciente.<br/><br/>
    <b>INDICAÇÕES</b><br/>
    • Flacidez facial leve a moderada<br/>
    • Flacidez corporal<br/>
    • Perda de contorno facial e corporal<br/>
    • Lifting não cirúrgico<br/>
    • Prevenção do envelhecimento<br/>
    • Melhora da firmeza da pele<br/><br/>
    <b>CONTRAINDICAÇÕES</b><br/>
    • Gravidez<br/>
    • Dispositivos eletrônicos implantáveis (ex: marca-passo)<br/>
    • Infecção ativa ou lesões na área tratada<br/>
    • Doenças autoimunes sem controle<br/>
    • Distúrbios neurológicos ou sensibilidade alterada na região<br/>
    • Neoplasias ativas<br/>
    • Uso de isotretinoína (avaliar caso a caso)<br/><br/>
    <b>POSSÍVEIS EFEITOS COLATERAIS</b><br/>
    O procedimento pode cursar com efeitos colaterais imediatos ou tardios, geralmente transitórios, que incluem:<br/>
    • Eritema (vermelhidão) local<br/>
    • Edema leve a moderado<br/>
    • Sensibilidade ou dor local<br/>
    • Sensação de formigamento<br/>
    • Dormência temporária<br/>
    • Hematomas (raros, porém possíveis)<br/>
    • Endurecimento ou irregularidade temporária do tecido<br/>
    • Sensação de choque leve durante a aplicação<br/>
    • Cefaleia transitória (principalmente em face)<br/>
    • Sensibilidade aumentada ao toque por alguns dias <br/>
    • Inflamação local persistente<br/>
    • Fibrose transitória<br/>
    • Parestesia prolongada <br/><br/>
    <b>ORIENTAÇÕES PRÉ-PROCEDIMENTO</b><br/>
    • Comparecer com a pele limpa, sem cremes, óleos ou maquiagem<br/>
    • Evitar uso de anti-inflamatórios nas 48h anteriores<br/>
    • Evitar consumo de bebida alcoólica 24h antes<br/>
    • Informar uso de medicações contínuas<br/><br/>
    <b>ORIENTAÇÕES PÓS-PROCEDIMENTO</b><br/>
    • Usar filtro solar FPS 50 ou superior<br/>
    • Evitar calor excessivo (sauna, banho muito quente) por 24h<br/>
    • Evitar atividade física intensa por 24h<br/>
    • Manter boa hidratação<br/>
    • Não tomar Sol por 30 dias<br/>
    • Não tomar bebida alcoólica por 24H após a sessão<br/>
    • Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,
  
  "TOXINA BOTULÍNICA": `
    <b>Toxina botulínica</b><br/>
    A toxina botulínica é um procedimento estético indicado para tratar as marcas provenientes das expressões faciais ou também tratar hiperidrose conforme região aplicada. O principal benefício do tratamento é a diminuição das rugas ou diminuição do suor. A ideia é introduzir um princípio ativo que induza uma melhora da queixa estética. Com pausas de 15-21 dias entre as sessões de retoque e no mínimo 3-6 meses para uma nova aplicação. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Infecção no local da aplicação (herpes, acne ativa)<br/>
    Patologia de transmissão neuromuscular (miastenia gravis)<br/>
    Gravidez e lactante<br/>
    Presença de glaucoma<br/>
    Cirurgias próximas<br/>
    Doença autoimune (Lúpus, Diabetes tipo 1, Artrite reumatoide, Tireoidite de Hashimoto, Esclerose múltipla, Vitiligo, Doença de Crohn, Doença celíaca).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Dor de cabeça<br/>
    Sensação de peso na região<br/>
    Eritema<br/>
    Edema<br/>
    Assimetria<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Alergia<br/>
    Hipersensibilidade<br/>
    Ptose palpebral<br/>
    Rima labial<br/>
    Queda labial<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica no dia da sessão.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região tratada 24H após a consulta.<br/>
    Não realizar atividade física ou grandes esforços por no dia da sessão.<br/>
    Evitar o uso de antiinflamatórios e analgésicos.<br/>
    Não massagear o local de aplicação.<br/>
    Evitar banhos quentes e calor no local da aplicação.<br/>
    Não se expor ao Sol por 30 dias após a sessão.<br/>
    Não coçar as regiões aplicadas, evitando contaminações.<br/>
    Não colocar a mão ou objetos próximos por 4H.<br/>
    Não tomar bebida alcoólica por 24H após a sessão.<br/>
    Evitar abaixar a cabeça pelas próximas 4H<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "SKINBOOSTER": `
    <b>Skinbooster</b><br/>
    O Skinbooster é um tratamento estético indicado à hidratação intensa e suavização de linhas de expressões, utilizando um produto concentrado que será injetado através de microagulhas ou cânulas, dentro da pele. O principal benefício do tratamento é a recuperação do ácido hialurônico e colágeno na pele. A ideia é introduzir um princípio ativo de ácido hialurônico não reticulado, DMAE, ELASTINA, IGF, D-pantenol, vitamina c (usada isolada dos demais fármacos), silício, n-acetilgucosamida, que são substâncias que induzem um processo de hidratação da pele.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Pacientes em tratamento de toxina botulínica (DMAE)<br/>
    Alergia a salicilatos (silício)<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem contole (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Gravidez e lactante.<br/>
    Paciente que faz peeling ou laser.<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Reação alérgica<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas na região das pernas no dia da consulta.<br/>
    Não ingerir bebidas alcoólicas.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Retirar o micropore entre 1-2H após a sessão<br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Higienizar o local com sabão neutro e água corrente e mantê-lo hidratado com creme.<br/>
    Não se expor ao Sol por 10 dias após a sessão<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "PREENCHIMENTO": `
    <b>Preenchimento</b><br/>
    O preenchimento é um procedimento estético indicado para recuperar volumização de determinadas regiões. O principal benefício do tratamento é a diminuição das rugas, volumização local e reposição de estruturas. A ideia é introduzir como princípio ativo o ácido hialurônido que vai melhora as diferentes queixas estéticas. Com pausas de 15-30 dias entre as sessões de retoque e no mínimo 6-12 meses para uma nova aplicação. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Implantes permanentes (PMMA, Silicone, Hidrogel)<br/>
    Distúrbios da coagulação<br/>
    Infecção no local da aplicação (herpes, acne ativa)<br/>
    Gravidez e lactante<br/>
    Doença autoimune ativas (Lúpus, Diabetes tipo 1, Artrite reumatoide, Tireoidite de Hashimoto, Esclerose múltipla, Vitiligo, Doença de Crohn, Doença celíaca).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/>
    Uso de aspirina ou ainti-inflamatórios não esteróides 4 semanas antes do tratamento e somente 4 semas após para não diminuir a duração do tratamento<br/>
    Antibiótico até 4 semanas antes e depois do tratatamento<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Assimetria<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Alergia<br/>
    Necrose cutânea<br/>
    Infecção<br/>
    Bolsas<br/>
    ETIP pode referir-se a Edema Tardio Intermitente e Persistente<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região tratada 24H após a consulta.<br/>
    Não realizar atividade física ou grandes esforços por 24H.<br/>
    Não beijar ou morder os lábios por no mínimo 3 dias.<br/>
    Evitar o uso de anti-inflamatórios, antibiótico e analgésicos por 15 dias após o procedimento<br/>
    Não realizar tratamentos com ácidos no mesmo dia.<br/>
    Não realizar tratamentos de radiofrequência, eletroestimulção ou técnicas que envolvam calor na região por 30 dias.<br/>
    Não massagear ou se apoiar o local de aplicação.<br/>
    Evitar banhos quentes e calor no local da aplicação.<br/>
    Não se expor ao Sol por 10 dias após a sessão.<br/>
    Não coçar as regiões aplicadas, evitando contaminações.<br/>
    Não tomar bebida alcoólica por 24H após a sessão.<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.<br/>
    Não colocar gelo.<br/>
    Mandar foto do local da aplicação 3 vezes por dia durante 3 dias.
  `,

  "PEIM": `
    <b>PEIM</b><br/>
    O PEIM (procedimento estético injetável para microvasos) é um tratamento indicado à eliminação das telangiectasias (microvasos) e veias reticulares, utilizando um líquido muito concentrado, chamado esclerosante, é injetado através de microagulhas, que são extremamente finas, dentro do vasinho. O principal benefício do tratamento é a oclusão do tronco varicoso em questão. A ideia é introduzir na veia o princípio ativo é a glicose 75% uma substância irritante, que induza um processo inflamatório, levando à fibrose, fazendo com que o vaso perca seu caráter cilíndrico e excluindo-o do caminho da circulação.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável<br/>
    Infecção local ou sistêmica (infecção urinária)<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão)<br/>
    Doença arterial periférica (arteriosclerose, claudicação intermitente, doença arterial obstrutiva periférica (DAOP), aneurismas arteriais periféricos, tromboangeíte obliterante (Doença de Buerger), fibromuscular displasia (FMD).<br/>
    Insuficiência renal, cardíaca e hepática.<br/>
    Gravidez e lactante.<br/>
    Trombofilias e Antecedente de trombose venosa profunda (TVP)<br/>
    Cirurgias próximas a sessão, estar em tratamento medicamentoso.<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Rubor<br/>
    Reação alérgica<br/>
    Edema<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Latência<br/>
    Leve sensação de cansaço nas pernas<br/>
    Hipersensibilidade<br/>
    Escaras (casquinhas)<br/>
    Hiperpigmentação<br/>
    Necrose<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas na região das pernas no dia da consulta.<br/>
    Não ingerir bebidas alcoólicas.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Retirar o micropore entre 1-2H após a sessão<br/>
    Usar filtro solar nas pernas após 24H, mínimo FPS 30 e repor de 3 em 3H, de toque seco preferencialmente com arnica para auxiliar na hidratação e recuperação da pele<br/>
    Higienizar o local com sabão neutro e água corrente e mantê-lo hidratado com creme.<br/>
    Não realizar esforço físico por 24H após a consulta.<br/>
    Não se manter em repouso total, deve caminhar sem grandes esforços<br/>
    Não se expor ao Sol por 10 dias após a sessão<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.<br/>
    Aguardar 72H para realização de exames, evitando enganos com as pequenas alterações.<br/>
    Caso apareça feridas (casquinhas) na pele é recomendado uso da pomada Tronk-N 2 a 3 vezes ao dia.<br/>
    Caso haja hiperpigmentação é recomendado realizar sessões de peeling.<br/>
    Usar trombofob, pomada tópica como home care de 2 a 3 vezes ao dia caso haja desconforto ou hematomas.<br/>
    Utilizar óleo ozonizado para ajudar na cicatrização da pele.
  `,

  "PEELING": `
    <b>Peeling</b><br/>
    O peeling é um procedimento estético que promove a renovação celular da pele por meio da aplicação de ácidos específicos. Ele pode ser superficial, médio ou profundo, dependendo da necessidade de cada paciente. É indicado para tratar manchas, melasma, rugas finas, acne, cicatrizes e até mesmo melhorar a textura e viço da pele. Os princípios ativos variam conforme o objetivo do tratamento, podendo incluir ácido salicílico, ácido glicólico, ácido retinoico, mandélico, entre outros, que estimulam a descamação controlada da pele e a produção de colágeno.<br/>
    O grande benefício do peeling é a melhora na qualidade da pele, deixando-a mais uniforme, rejuvenescida e luminosa..<br/><br/>
    <b>Contraindicações:</b><br/>
    Gestantes e lactantes<br/>
    Pessoas com infecções ativas na pele, como herpes<br/>
    Pacientes em uso de isotretinoína oral (Roacutan)<br/>
    Peles muito sensíveis ou sensibilizadas por outros tratamentos<br/>
    Pessoas com tendência a queloides<br/>
    Exposição solar intensa sem proteção adequada<br/>
    Doenças autoimunes em atividade<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Alegia<br/>
    Desenvolvimento de acne<br/>
    Ativação de herpes<br/>
    Arranhão<br/>
    Hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Infecção<br/>
    Necrose<br/>
    Descamação na pele<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Aplicar filtro solar fps50 ou superior<br/>
    Não usar maquiagem por 48H<br/>
    Não puxar ou remover a descamação da pele<br/>
    Hidratar a região<br/>
    Evitar uso de ácidos e produtos abrasivos<br/>
    Lavar o local após 4H da sessão com água fria corrente<br/>
    Não tomar Sol por 30 dias<br/>
    Não tomar banho quente ou tampar o local<br/>
    Não aplicar máscara calmante<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "PDRN": `
    <b>PDRN</b><br/>
    O PDRN é um tratamento estético regenerativo indicado para reparação tecidual, estímulo celular e melhora da qualidade da pele. Atua promovendo regeneração, aumento da hidratação, melhora da elasticidade, textura e viço da pele, sendo indicado para envelhecimento cutâneo, cicatrizes, flacidez leve e pele sensibilizada.<br/>
    O protocolo varia de acordo com a indicação, geralmente com sessões mensais ou quinzenais.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Implantes permanentes (PMMA, Silicone, Hidrogel)<br/>
    Distúrbios da coagulação<br/>
    Infecção no local da aplicação (herpes, acne ativa)<br/>
    Gravidez e lactante<br/>
    Doença autoimune ativas (Lúpus, Diabetes tipo 1, Artrite reumatoide, Tireoidite de Hashimoto, Esclerose múltipla, Vitiligo, Doença de Crohn, Doença celíaca).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/>
    Uso de aspirina ou ainti-inflamatórios não esteróides 4 semanas antes do tratamento e somente 4 semas após para não diminuir a duração do tratamento<br/>
    Antibiótico até 4 semanas antes e depois do tratatamento<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Assimetria<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Alergia<br/>
    Necrose cutânea<br/>
    Infecção<br/>
    Bolsas<br/>
    ETIP pode referir-se a Edema Tardio Intermitente e Persistente<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região tratada 24H após a consulta.<br/>
    Não realizar atividade física ou grandes esforços por 24H.<br/>
    Não beijar ou morder os lábios por no mínimo 3 dias.<br/>
    Evitar o uso de anti-inflamatórios, antibiótico e analgésicos por 15 dias após o procedimento<br/>
    Não realizar tratamentos com ácidos no mesmo dia.<br/>
    Não realizar tratamentos de radiofrequência, eletroestimulção ou técnicas que envolvam calor na região por 30 dias.<br/>
    Não massagear ou se apoiar o local de aplicação.<br/>
    Evitar banhos quentes e calor no local da aplicação.<br/>
    Não se expor ao Sol por 10 dias após a sessão.<br/>
    Não coçar as regiões aplicadas, evitando contaminações.<br/>
    Não tomar bebida alcoólica por 24H após a sessão.<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.<br/>
    Não colocar gelo.<br/>
    Mandar foto do local da aplicação 3 vezes por dia durante 3 dias.
  `,

  "MICROAGULHAMENTO": `
    <b>Microagulhamento</b><br/>
    O microagulhamento é um tratamento estético indicado à estímulo de colágeno, cicatriz de acne, cicatriz atrófica, linhas de expressões, rugas, estrias, alopécia, manchas ou até mesmo melasma, utilizando o processo de drug delivery para levar ativos específicos que são penetrados através de microagulhas, dentro da pele. O principal benefício do tratamento é melhorar a qualidade e estimular colágeno na pele. A ideia é introduzir um princípio ativo que induza um processo de reparação da pele.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução.<br/>
    Acne ativa<br/>
    Cicatriz queloidiana<br/>
    Propensão a quelóide<br/>
    Herpes simples ativa<br/>
    Câncer de pele<br/>
    Verrugas<br/>
    Rosácea<br/>
    Doenças vasculares<br/>
    Doenças neuromusculares<br/>
    Uso de anticoagulantes<br/>
    Uso de aspirina regularmente<br/>
    Neoplasias<br/>
    Pacientes em quimioterapia ou radioterapia<br/>
    Pele bronzeada<br/>
    Gravidez e lactante<br/>
    Alterações da coagulação<br/>
    Isotretinoína nos últimos 6 meses<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem contole (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Desenvolvimento de acne<br/>
    Alergia<br/>
    Ativação de herpes<br/>
    Arranhão<br/>
    Hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas na região das pernas no dia da consulta.<br/>
    Não ingerir bebidas alcoólicas.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Não usar maquiagem por no mínimo 7 dias<br/>
    Lavar o local após 4H da sessão com água fria corrente<br/>
    Não tomar Sol por 30 dias<br/>
    Não tomar banho quente ou tampar o local<br/>
    Não aplicar máscara calmante<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "MESOTERAPIA": `
    <b>Mesoterapia</b><br/>
    A mesoterapia é um procedimento estético indicado para melhorar a circulação local, utilizando uma mescla com diferentes potentes ativos injetados através de microagulhas dentro da pele. O principal benefício do tratamento é a diminuição da queda capilar. A ideia é introduzir um princípio ativo que induza uma melhora na aparência. Com pausas 7-10 dias entre as sessões, podendo fazer até 30 sessões com pausa de dois meses a cada 10 sessões. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Atopia respiratória (asma, rinite, bronquite ou eczema/dermatite alérgica)<br/>
    Gravidez e lactante.<br/>
    Tumores e câncer<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Febre<br/>
    Dor no corpo todo<br/>
    Reações alérgicas<br/>
    Necrose cutânea<br/>
    Infecção<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Lavar o cabeça apenas com shampoo, não utilizar cremes, óleos ou condicionadores<br/>
    Evitar uso de cremes, óleos e pomadas e desodorantes na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica, carne de porco, frutos do mar e doces no dia anterior, no dia da consulta e um dia após a sessão, totalizando três (3) dias.<br/>
    Não realizar atividade física no dia da sessão<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar lavar o cabelo por 4H após o procedimento<br/>
    Higienizar o local com sabão neutro e água após 4H.<br/>
    Não se expor ao Sol por 10 dias após a sessão<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "LIMPEZA DE PELE PROFUNDA": `
    <b>Limpeza de pele profunda</b><br/>
    A limpeza de pele é um procedimento estético indicado para remoção de impurezas, células mortas, comedões e excesso de oleosidade, promovendo melhora da textura, viço e saúde da pele. Também prepara a pele para melhor absorção de ativos e outros tratamentos estéticos.<br/>
    Pode ser realizada a cada 30 a 60 dias, de acordo com o tipo de pele e necessidade.<br/><br/>
    <b>Contraindicações:</b><br/>
    • Infecção ativa na pele<br/>
    • Acne inflamatória grave<br/>
    • Dermatites, eczema ou feridas abertas<br/>
    • Uso recente de isotretinoína (avaliar caso a caso)<br/><br/>
    <b>Possíveis efeitos:</b><br/>
    • Eritema leve e transitório<br/>
    • Sensibilidade local<br/>
    • Pequenos edemas após extrações<br/><br/>
    <b>Orientações pré:</b><br/>
    • Evitar uso de ácidos e esfoliantes 5 dias antes<br/>
    • Não se expor ao sol intensamente<br/><br/>
    <b>Orientações pós:</b><br/>
    • Evitar maquiagem por 24h<br/>
    • Usar filtro solar FPS 50 ou superior<br/>
    • Evitar sol, sauna e atividade física intensa por 24h
  `,

  "LAVIEEN": `
    <b>Lavieen</b><br/>
    O laser lavieen é um tratamento estético indicado para estímulo de colágeno, cicatriz de acne, cicatriz atrófica, linhas de expressão, rugas, estrias, alopécia, manchas, melasma, controle de oleosidade e fechamento de poros dilatados, utilizando o processo de drug delivery para levar ativos específicos que são penetrados através de desses micro canais que serão feitos pela máquina na pele. O principal benefício do tratamento é melhorar a qualidade e estimular colágeno na pele. A ideia é introduzir um princípio ativo que induza um processo de reparação da pele.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução.<br/>
    Acne ativa<br/>
    Cicatriz queloidiana<br/>
    Propensão a quelóide<br/>
    Herpes simples ativa<br/>
    Câncer de pele<br/>
    Verrugas<br/>
    Uso de anticoagulantes<br/>
    Uso de aspirina regularmente<br/>
    Neoplasias<br/>
    Pacientes em quimioterapia ou radioterapia<br/>
    Pele bronzeada<br/>
    Gravidez e lactante<br/>
    Alterações da coagulação<br/>
    Isotretinoína nos últimos 6 meses<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão, porém é necessário medir a pressão antes e depois da sessão).<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Alergia<br/>
    Ativação de herpes<br/>
    Arranhão<br/>
    Hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Marcas<br/>
    Manchas<br/>
    Queimaduras<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas na região das pernas no dia da consulta.<br/>
    Não ingerir bebidas alcoólicas.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Não usar maquiagem por no mínimo 7 dias<br/>
    Lavar o local após 4H da sessão com água fria corrente<br/>
    Não tomar Sol por 30 dias<br/>
    Não tomar banho quente ou tampar o local<br/>
    Não aplicar máscara calmante<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "JATO DE PLASMA": `
    <b>Jato de plasma</b><br/>
    O Jato de plasma é um tratamento estético indicado para estímulo de colágeno, cicatriz de acne, cicatriz atrófica, linhas de expressão, rugas, estrias, manchas, Xantelasmas, Siringomas, Nevus intradérmico, Fibromas, Ceratoses seborreicas, através de uma máquina de alta tecnologia que direciona uma energia local para tratar as diversas queixas estéticas. O principal benefício do tratamento é melhorar a qualidade da pele. A ideia é introduzir uma energia que induza um processo de reparação da pele.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução.<br/>
    Acne ativa<br/>
    Cicatriz queloidiana<br/>
    Propensão a quelóide<br/>
    Herpes simples ativa<br/>
    Câncer de pele<br/>
    Verrugas<br/>
    Uso de anticoagulantes<br/>
    Uso de aspirina regularmente<br/>
    Neoplasias<br/>
    Pacientes em quimioterapia ou radioterapia<br/>
    Pele bronzeada<br/>
    Gravidez e lactante<br/>
    Alterações da coagulação<br/>
    Isotretinoína nos últimos 6 meses<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão, porém é necessário medir a pressão antes e depois da sessão).<br/><br/>
    <b>O tratamento é passível de riscos e efeitos colaterais imediatas ou tardias, que são previstas e devem desaparecer em até 20 dias, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Alergia<br/>
    Ativação de herpes<br/>
    Arranhão<br/>
    Hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Marcas<br/>
    Manchas<br/>
    Queimaduras<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas na região das pernas no dia da consulta.<br/>
    Não ingerir bebidas alcoólicas.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Não usar maquiagem por no mínimo 7 dias<br/>
    Lavar o local após 4H da sessão com água fria corrente<br/>
    Não tomar Sol por 30 dias<br/>
    Não tomar banho quente ou tampar o local<br/>
    Não aplicar máscara calmante<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não tomar bebida alcoólica por 24H após a sessão<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `,

  "INTRADERMOTERAPIA LOCAL": `
    <b>Intradermoterapia local</b><br/>
    A Intradermoterapia local é um procedimento estético indicado para melhorar a circulação local, utilizando uma mescla com diferentes potentes ativos injetados através de microagulhas dentro da pele. O principal benefício do tratamento é a melhora da aparência em diferentes queixas estéticas, como celulite, estrias, flacidez, acúmulo de gordura ou também manchas. A ideia é introduzir um princípio ativo específico para cada queixa estética, que induza a uma melhora na aparência. Com pausas 7-10 dias entre as sessões, podendo fazer até 30 sessões com pausa de dois meses a cada 10 sessões. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Atopia respiratória (asma, rinite, bronquite ou eczema/dermatite alérgica)<br/>
    Gravidez e lactante.<br/>
    Tumores e câncer<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Febre<br/>
    Dor no corpo todo<br/>
    Reações alérgicas<br/>
    Necrose cutânea<br/>
    Infecção<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e desodorantes na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica, carne de porco, frutos do mar e doces no dia anterior, no dia da consulta e um dia após a sessão, totalizando três (3) dias.<br/>
    Não realizar atividade física no dia da sessão<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Usar devidamente a cinta modeladora<br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Realizar outros tratamentos estéticos complementares após 24H<br/>
    Praticar atividade física após 24H<br/>
    Manter uma alimentação saudável, não ingerir bebida alcoólica ou refrigerantes, alimentos gordurosos e doces<br/>
    Retirar o micropore entre 1-2H após a sessão<br/>
    Higienizar o local com sabão neutro e água corrente e mantê-lo hidratado com creme.<br/>
    Não se expor ao Sol por 10 dias após a sessão<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não ingerir bebida alcoólica, carne de porco, frutos do mar e doces no dia anterior, no dia da consulta e um dia após a sessão, totalizando três (3) dias.
  `,

  "INTRADERMOTERAPIA IM": `
    <b>Intradermoterapia IM</b><br/>
    A Intradermoterapia intramuscular é um procedimento estético indicado para melhorar a circulação corporal, utilizando uma mescla com diferentes potentes ativos injetados através de agulhas dentro do músculo. O principal benefício do tratamento é pelo seu efeito de acelerador metabólico, ou também anticatabólico. A ideia é introduzir um princípio ativo específico para cada queixa estética, que induza a uma melhora na aparência. Com pausas 7-10 dias entre as sessões, podendo fazer até 30 sessões com pausa de dois meses a cada 10 sessões. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Infecção local ou sistêmica (infecção urinária).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Atopia respiratória (asma, rinite, bronquite ou eczema/dermatite alérgica)<br/>
    Gravidez e lactante.<br/>
    Tumores e câncer<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Febre<br/>
    Dor no corpo todo<br/>
    Reações alérgicas<br/>
    Necrose cutânea<br/>
    Infecção<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e desodorantes na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica, carne de porco, frutos do mar e doces no dia anterior, no dia da consulta e um dia após a sessão, totalizando três (3) dias.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Realizar outros tratamentos estéticos complementares após 24H<br/>
    Retirar o micropore entre 1-2H após a sessão<br/>
    Não aplicar filtro solar por 24H, após as 24H usar FPS de 50 ou superior e reaplicar sempre de 3 em 3H<br/>
    Higienizar o local com sabão neutro e água corrente e mantê-lo hidratado com creme.<br/>
    Realizar atividade física no dia da sessão<br/>
    Manter uma alimentação saudável, não ingerir bebida alcoólica ou refrigerantes, alimentos gordurosos e doces<br/>
    Não se expor ao Sol por 10 dias após a sessão<br/>
    Não coçar as regiões aplicadas, evitando contaminações<br/>
    Não ingerir bebida alcoólica, carne de porco, frutos do mar e doces no dia anterior, no dia da consulta e um dia após a sessão, totalizando três (3) dias.
  `,

  "FIOS DE PDO": `
    <b>Fios de pdo</b><br/>
    Os Fios de Sustentação de Polidioxanona (PDO) se trata de um procedimento estético indicado para promover tração dos tecidos em determinadas regiões. O principal benefício do tratamento é a diminuição das rugas e reposição de estruturas. A ideia é introduzir como princípio ativo os Fios de PDO que vão agir na região e melhorar as diferentes queixas estéticas. Com pausas de 30 dias entre as sessões de retoque e no mínimo 06-08 meses para uma nova aplicação. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo.<br/>
    Uso de vitamina A, vitamina E, biotina, capsulas de óleo de peixe, ginseng ginko biloba (contraindicação relativa, fica mais roxa e sangra mais)<br/>
    Quelóides<br/>
    Gravidez e lactante<br/>
    Implantes permanentes (PMMA, Silicone, Hidrogel)<br/>
    Distúrbios da coagulação (contraindicação relativa, fica mais roxa e sangra mais)<br/>
    Infecção no local da aplicação (herpes, acne ativa)<br/>
    Doença autoimune ativas (Lúpus, Diabetes tipo 1, Artrite reumatoide, Tireoidite de Hashimoto, Esclerose múltipla, Vitiligo, Doença de Crohn, Doença celíaca, lipedema, melasma local).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/>
    Uso de aspirina ou ainti-inflamatórios não esteróides 4 semanas antes do tratamento e somente 4 semas após para não diminuir a duração do tratamento<br/>
    Antibiótico até 4 semanas antes e depois do tratatamento<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Alergia<br/>
    Edema<br/>
    Assimetria<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Necrose cutânea<br/>
    Infecção<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica no dia da sessão.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região tratada 24H após a consulta.<br/>
    Não realizar atividade física ou grandes esforços no dia da sessão.<br/>
    Evitar o uso de anti-inflamatórios, antibiótico e analgésicos por 15 dias após o procedimento<br/>
    Não realizar tratamentos com ácidos no mesmo dia.<br/>
    Não realizar tratamentos de radiofrequência, eletroestimulção ou técnicas ue envolvam calor na região por 30 dias.<br/>
    Não massagear o local de aplicação.<br/>
    Evitar banhos quentes e calor no local da aplicação.<br/>
    Não se expor ao Sol por 10 dias após a sessão.<br/>
    Não coçar as regiões aplicadas, evitando contaminações.<br/>
    Não tomar bebida alcoólica por 24H após a sessão.<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.<br/>
    Mandar foto do local da aplicação 3 vezes por dia durante 3 dias.
  `,

  "BIOESTIMULADOR": `
    <b>Bioestimulador</b><br/>
    O Bioestimulador de Colágeno é um procedimento estético indicado para recuperar o colágeno na região aplicada. O principal benefício do tratamento é a diminuição da flacidez e reposição de estruturas. A ideia é introduzir como princípio ativo a hidroxiapatita de cálcio ou ácido L-polilático que vai melhorar as diferentes queixas estéticas. Com pausas de 30-60 dias entre as sessões de retoque e no mínimo 12 meses para uma nova aplicação. Os resultados duram enquanto houver a manutenção estética e indicações seguidas corretamente com acompanhamento profissional.<br/><br/>
    <b>Contraindicações:</b><br/>
    Alergia a algum ativo da solução injetável.<br/>
    Implantes permanentes (PMMA, Silicone, Hidrogel)<br/>
    Distúrbios da coagulação<br/>
    Infecção no local da aplicação (herpes, acne ativa)<br/>
    Gravidez e lactante<br/>
    Doença autoimune ativas (Lúpus, Diabetes tipo 1, Artrite reumatoide, Tireoidite de Hashimoto, Esclerose múltipla, Vitiligo, Doença de Crohn, Doença celíaca).<br/>
    Doença sistêmica sem controle (lúpus, diabetes, mesmo com liberação médica e hipertensão porém é necessário medir a pressão antes e depois da sessão).<br/>
    Estar em tratamento medicamentoso ou cirurgia recente<br/>
    Uso de aspirina ou ainti-inflamatórios não esteróides 4 semanas antes do tratamento e somente 4 semas após para não diminuir a duração do tratamento<br/>
    Antibiótico até 4 semanas antes e depois do tratatamento<br/><br/>
    <b>O tratamento é passível de efeitos colaterais imediatas ou tardias que são previstas e devem desaparecer em até 20 dias e riscos em casos isolados, como:</b><br/>
    Dor no local da aplicação<br/>
    Eritema<br/>
    Edema<br/>
    Assimetria<br/>
    Equimose ou hematoma<br/>
    Urticária<br/>
    Hipersensibilidade<br/>
    Necrose cutânea<br/>
    Infecção<br/>
    Alergia<br/><br/>
    <b>Orientações pré procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região a ser tratada no dia da consulta.<br/>
    Não ingerir bebida alcoólica no dia da sessão.<br/><br/>
    <b>Orientações pós procedimento:</b><br/>
    Evitar uso de cremes, óleos e pomadas e maquiagem na região tratada 24H após a consulta.<br/>
    Não realizar atividade física ou grandes esforços no dia da sessão.<br/>
    Evitar o uso de anti-inflamatórios, antibiótico e analgésicos por 15 dias após o procedimento<br/>
    Não realizar tratamentos de radiofrequência, eletroestimulção ou técnicas ue envolvam calor na região por 30 dias.<br/>
    Massagear vigorosamente o local de aplicação 05 vezes ao dia, durante 05 minutos por 05 dias.<br/>
    Evitar banhos quentes e calor no local da aplicação.<br/>
    Não se expor ao Sol por 30 dias após a sessão.<br/>
    Não coçar as regiões aplicadas, evitando contaminações.<br/>
    Não tomar bebida alcoólica por 24H após a sessão.<br/>
    Não realizar outros tratamentos estéticos no mesmo dia e na mesma região.
  `
};

export function buildContractHtml(params: {
  patient: { name: string; email?: string | null; phone?: string | null; birthDate?: string | Date | null; cpf?: string | null; rg?: string | null; };
  clinic: { companyName: string; cnpj: string; address: string; email: string; };
  items: ContractItem[];
  subtotal: number; discount: number; total: number;
  paymentMethodLabel: string; paymentDetails?: string | null; contractDate?: string | Date | null;
}) {
  
  const itemsRows = params.items.map((item, index) => `
    <tr>
      <td style="padding:8px; border:1px solid #ddd; text-align:center;">${index + 1}</td>
      <td style="padding:8px; border:1px solid #ddd;">${item.description} ${item.observation ? `<br/><small style="color: #555;">Obs: ${item.observation}</small>` : ''}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:center;">${item.quantity}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:8px; border:1px solid #ddd; text-align:right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join("");

  const specificTreatmentsHtml = params.items.map(item => {
    const normalizedDesc = item.description.toUpperCase().trim();
    const foundKey = Object.keys(TREATMENT_TEXTS).find(key => 
        normalizedDesc.includes(key) || key.includes(normalizedDesc)
    );
    
    const clauseText = foundKey ? TREATMENT_TEXTS[foundKey] : null;
    
    if (clauseText) {
      return `<div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 3px solid #C8A35F; font-size: 11px; line-height: 1.6; page-break-inside: auto;">
                ${clauseText}
              </div>`;
    }
    return '';
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color:#111; line-height:1.5; font-size: 13px; padding: 10px;">
      <h2 style="text-align:center; color:#111; font-size: 16px; text-transform: uppercase;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS</h2>

      <div style="margin-bottom: 20px; font-size: 12px;">
        <p><strong>CONTRATANTE:</strong> ${params.patient.name} - CPF: ${params.patient.cpf ?? "Não informado"} - RG: ${params.patient.rg ?? "Não informado"} - Nasc: ${formatDate(params.patient.birthDate)} - Tel: ${params.patient.phone ?? "Não informado"}</p>

        <p><strong>CONTRATADA:</strong><br/>
        Nome: ${params.clinic.companyName}<br/>
        CNPJ: ${params.clinic.cnpj}<br/>
        Endereço: ${params.clinic.address}<br/>
        Email: ${params.clinic.email}</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />

      <p style="font-size: 12px;">As partes acima identificadas firmam o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS.</p>
      <p style="font-size: 12px;">Para execução do tratamento contratado, a CONTRATANTE adquire os seguintes itens:</p>

      <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size: 11px;">
        <thead>
          <tr style="background-color: #f1f1f1;">
            <th style="padding:8px; border:1px solid #ddd; text-align:center; width: 5%;">#</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:left; width: 40%;">Produto / Serviço</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:center; width: 10%;">Qtd.</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right; width: 20%;">Vlr. Unitário</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right; width: 25%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top:20px; font-size: 12px; text-align: right;">
        <p style="margin: 4px 0;"><strong>SubTotal:</strong> ${formatCurrency(params.subtotal)}</p>
        <p style="margin: 4px 0;"><strong>Desconto:</strong> ${formatCurrency(params.discount)}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Total a Pagar:</strong> ${formatCurrency(params.total)}</p>
      </div>

      <div style="margin-top:20px; font-size: 11px; background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd;">
        <p style="margin: 0 0 5px 0;"><strong>Forma de Pagamento:</strong> ${params.paymentMethodLabel}</p>
        <p style="margin: 0;"><strong>Detalhes:</strong> Pagamento processado na data de fechamento.</p>
      </div>

      <div style="page-break-inside: auto;">
        <h3 style="margin-top:32px; font-size: 13px; color: #C8A35F; text-transform: uppercase;">CLÁUSULAS GERAIS E TERMOS</h3>
        <div style="font-size: 11px; line-height: 1.6; text-align: justify;">
          <p><strong>1. OBJETO E VIGÊNCIA:</strong> O presente contrato tem por objeto a prestação de serviços estéticos pela CONTRATADA, incluindo os tratamentos descritos neste documento. A CONTRATANTE declara estar ciente de que todas as sessões contratadas devem ser utilizadas dentro do prazo de vigência deste contrato, que é de 3 (três) meses.</p>
          <p><strong>2. AGENDAMENTOS E FALTAS:</strong> As sessões somente se realizam mediante agendamento prévio. O atraso ou não comparecimento poderá implicar na perda da sessão.</p>
          <p><strong>3. DESISTÊNCIA E RESULTADOS:</strong> A simples insatisfação com os serviços não ensejará devolução dos valores pagos. Em caso de desistência ou interrupção do tratamento, haverá cobrança de despesas administrativas fixadas em 15% sobre o valor do contrato, além das sessões já realizadas.</p>
          <p><strong>4. ANAMNESE:</strong> A CONTRATANTE declara ter preenchido integralmente a ficha de anamnese e que as informações são verdadeiras.</p>
          
          <br/>
          <p><strong>5. TERMO DE CONSENTIMENTO E PROTEÇÃO DE DADOS:</strong> Estamos empenhados em salvaguardar a sua privacidade ao estabelecer esta relação conosco. Este termo tem a finalidade de deixar o mais claro possível a nossa política de coleta e compartilhamento de dados, informando sobre os dados coletados e como os utilizamos. Ao utilizar os nossos serviços e assinar o presente termo, você declara o seu EXPRESSO CONSENTIMENTO para coletarmos, tratarmos e armazenarmos dados sobre você quando julgarmos necessários à prestação de nossos serviços, tais como: Informações que você oferece: coletamos os dados fornecidos por você no cadastro, tais como nome e sobrenome, endereço para correspondência, endereço de e-mail, informações de pagamento, bem como outras informações de contato on-line ou número de telefone, foto e demais informações requeridas no cadastro. Comunicação: podemos registrar e gravar todos os dados fornecidos em toda comunicação realizada com nossa equipe, seja por correio eletrônico, mensagens, telefone ou qualquer outro meio. Redes sociais: podemos utilizar e publicar suas fotos registradas antes e após o procedimento estético na rede social da clínica, por tempo indeterminado. Todos os dados que você nos fornece são tratados unicamente para atingir as finalidades acima listadas. Nós manteremos as informações que coletamos de você até que ocorra a solicitação de exclusão definitiva por sua parte. Neste caso, nós cessaremos imediatamente a utilização dos seus dados para fins comerciais, porém armazenaremos os seus dados enquanto tenhamos obrigações legais, tributárias ou judiciais a cumprir com tais dados. Você pode solicitar informações, alteração, esclarecimentos ou exclusão de seus dados por meio do contato (11) 96723-9595. Vamos exercer imediatamente as solicitações, nos termos da lei de proteção de dados aplicável.</p>

          <br/>
          <p><strong>6. TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM:</strong> Eu, ${params.patient.name}, CPF nº ${params.patient.cpf ?? "Não informado"}, RG nº ${params.patient.rg ?? "Não informado"}, declaro, de forma livre, consciente e informada, que AUTORIZO a empresa Thomaz & Carmona LTDA, CNPJ nº 57.007.483/0001-73, a utilizar, a título gratuito, minha imagem (fotografias, vídeos ou gravações), captadas antes, durante ou após a realização de procedimentos estéticos, para os seguintes fins: Divulgação em redes sociais (Instagram, Facebook, TikTok, etc.); Materiais publicitários impressos e/ou digitais; Apresentações em eventos, palestras ou cursos; Registro para fins clínicos e comparativos. Estou ciente de que: A minha imagem poderá ser utilizada por tempo indeterminado; A autorização é concedida sem qualquer remuneração; A identidade poderá ser preservada, mediante solicitação. Declaro, ainda, que fui devidamente esclarecido(a) sobre o uso da imagem e que esta autorização é opcional, podendo ser revogada a qualquer tempo mediante solicitação por escrito, sem prejuízo dos usos anteriores à revogação.</p>
        </div>
      </div>

      <div style="page-break-inside: auto;">
        <h3 style="margin-top:32px; font-size: 13px; color: #C8A35F; text-transform: uppercase;">ESPECIFICAÇÕES DOS PROCEDIMENTOS</h3>
        <p style="font-size: 11px; color: #333; margin-bottom: 15px;">O paciente declara estar ciente das indicações, contraindicações e cuidados pós-procedimento descritos abaixo para cada serviço adquirido:</p>
        
        ${specificTreatmentsHtml || "<p style='font-size: 11px; font-style: italic;'>* Especificações gerais de consultório repassadas pela profissional responsável.</p>"}
      </div>

      <div style="page-break-inside: avoid;">
        <p style="margin-top:40px; text-align: center; font-style: italic; font-size: 11px;">São Paulo, ${formatDate(params.contractDate ?? new Date())}</p>

        <table style="width: 100%; margin-top: 60px; text-align: center; border: none;">
          <tr>
            <td style="width: 45%; padding: 0 10px; border: none;">
              <hr style="border: 0; border-top: 1px solid #111; margin-bottom: 5px;" />
              <p style="font-size: 11px; margin: 0;">${params.clinic.companyName}<br/>Contratada</p>
            </td>
            <td style="width: 10%; border: none;"></td>
            <td style="width: 45%; padding: 0 10px; border: none;">
              <hr style="border: 0; border-top: 1px solid #111; margin-bottom: 5px;" />
              <p style="font-size: 11px; margin: 0;">${params.patient.name}<br/>Contratante</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `.trim();
}