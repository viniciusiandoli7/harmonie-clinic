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
  const contractDate = formatDate(params.contractDate ?? new Date());
  const patientCpf = params.patient.cpf || "Não informado";
  const patientRg = params.patient.rg || "Não informado";
  const patientPhone = params.patient.phone || "Não informado";
  const patientBirthDate = formatDate(params.patient.birthDate) || "Não informado";

  const itemsRows = params.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${item.description}</strong>
        ${item.observation ? `<div class="muted small">Observação: ${item.observation}</div>` : ""}
      </td>
      <td class="center">${item.quantity}</td>
      <td class="right">${formatCurrency(item.unitPrice)}</td>
      <td class="right"><strong>${formatCurrency(item.total)}</strong></td>
    </tr>
  `).join("");

  const specificTreatmentsHtml = params.items.map((item) => {
    const normalizedDesc = item.description.toUpperCase().trim();
    const foundKey = Object.keys(TREATMENT_TEXTS).find((key) =>
      normalizedDesc.includes(key) || key.includes(normalizedDesc)
    );

    const clauseText = foundKey ? TREATMENT_TEXTS[foundKey] : null;

    if (!clauseText) return "";

    return `
      <section class="contract-section procedure-section">
        <h3>Termo específico — ${foundKey}</h3>
        <div class="procedure-text">${clauseText}</div>
      </section>
    `;
  }).join("");

  return `
    <div class="contract-document">
      <style>
        @page {
          size: A4;
          margin: 16mm 14mm;
        }

        .contract-document {
          width: 100%;
          max-width: 172mm;
          margin: 0 auto;
          background: #FDFBF7;
          color: #1E1A18;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.5px;
          line-height: 1.52;
          box-sizing: border-box;
          overflow: hidden;
          overflow-wrap: break-word;
        }

        .contract-document * {
          box-sizing: border-box;
        }

        .contract-header {
          text-align: center;
          border-bottom: 1px solid #D8C4AE;
          padding-bottom: 14px;
          margin-bottom: 18px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .brand-name {
          font-size: 12px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #5A1F2B;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .contract-title {
          margin: 0;
          font-size: 17px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1E1A18;
          font-weight: 700;
        }

        .contract-subtitle {
          margin-top: 6px;
          font-size: 10px;
          color: #5B3A2E;
        }

        .info-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
          margin: 18px 0;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .info-card {
          border: 1px solid #E4D8CA;
          background: #F7F2EA;
          padding: 12px;
          min-height: 94px;
        }

        .info-card h3,
        .contract-section h3 {
          margin: 0 0 8px 0;
          color: #5A1F2B;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .info-card p {
          margin: 3px 0;
        }

        .intro {
          margin: 18px 0 14px 0;
          text-align: justify;
        }

        table {
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          table-layout: fixed;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        th {
          background: #EFE5DA;
          color: #1E1A18;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 7px;
          border: 1px solid #D8C4AE;
          overflow-wrap: anywhere;
        }

        td {
          padding: 7px;
          border: 1px solid #E4D8CA;
          vertical-align: top;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .center {
          text-align: center;
        }

        .right {
          text-align: right;
        }

        .small {
          font-size: 9px;
        }

        .muted {
          color: #5B3A2E;
          opacity: 0.75;
        }

        .totals {
          margin-top: 12px;
          margin-left: auto;
          width: 240px;
          max-width: 100%;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 3px 0;
        }

        .totals-row.final {
          border-top: 1px solid #D8C4AE;
          margin-top: 6px;
          padding-top: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        .payment-box {
          margin-top: 16px;
          border: 1px solid #E4D8CA;
          background: #F7F2EA;
          padding: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .contract-section {
          margin-top: 20px;
        }

        .general-clauses p {
          margin: 7px 0;
          text-align: justify;
        }

        .procedure-section {
          page-break-before: auto;
        }

        .procedure-text {
          border-left: 3px solid #C9A227;
          padding: 4px 0 4px 12px;
          line-height: 1.58;
        }

        .procedure-text b {
          color: #1E1A18;
        }

        .signature-section {
          margin-top: 28px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .signature-date {
          text-align: center;
          margin-bottom: 42px;
          font-style: italic;
        }

        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          text-align: center;
        }

        .signature-line {
          border-top: 1px solid #1E1A18;
          padding-top: 8px;
          min-height: 42px;
        }

        .footer-note {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #5B3A2E;
        }

        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          .contract-document {
            background: #fff;
          }

          .contract-section,
          .procedure-section {
            page-break-inside: auto;
            break-inside: auto;
          }

          .info-grid,
          table,
          .totals,
          .payment-box,
          .signature-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      </style>

      <header class="contract-header">
        <div class="brand-name">Mariana Thomaz Carmona</div>
        <h1 class="contract-title">Contrato de prestação de serviços estéticos</h1>
        <div class="contract-subtitle">Documento emitido em ${contractDate}</div>
      </header>

      <section class="info-grid">
        <div class="info-card">
          <h3>Contratante</h3>
          <p><strong>Nome:</strong> ${params.patient.name}</p>
          <p><strong>CPF:</strong> ${patientCpf}</p>
          <p><strong>RG:</strong> ${patientRg}</p>
          <p><strong>Nascimento:</strong> ${patientBirthDate}</p>
          <p><strong>Telefone:</strong> ${patientPhone}</p>
        </div>

        <div class="info-card">
          <h3>Contratada</h3>
          <p><strong>Nome:</strong> ${params.clinic.companyName}</p>
          <p><strong>CNPJ:</strong> ${params.clinic.cnpj}</p>
          <p><strong>Endereço:</strong> ${params.clinic.address}</p>
          <p><strong>E-mail:</strong> ${params.clinic.email}</p>
        </div>
      </section>

      <section class="intro">
        <p>
          As partes identificadas acima firmam o presente contrato para prestação de serviços estéticos,
          conforme procedimentos, valores, condições de pagamento, orientações e termos de consentimento descritos neste documento.
        </p>
      </section>

      <section class="contract-section avoid-break">
        <h3>Procedimentos contratados</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 7%;">#</th>
              <th style="width: 43%; text-align: left;">Produto / Serviço</th>
              <th style="width: 10%;">Qtd.</th>
              <th style="width: 20%; text-align: right;">Valor unitário</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><strong>${formatCurrency(params.subtotal)}</strong></div>
          <div class="totals-row"><span>Desconto</span><strong>${formatCurrency(params.discount)}</strong></div>
          <div class="totals-row final"><span>Total a pagar</span><span>${formatCurrency(params.total)}</span></div>
        </div>

        <div class="payment-box">
          <p style="margin: 0 0 5px 0;"><strong>Forma de pagamento:</strong> ${params.paymentMethodLabel}</p>
          <p style="margin: 0;"><strong>Detalhes:</strong> ${params.paymentDetails || "Pagamento registrado na data de fechamento da venda."}</p>
        </div>
      </section>

      <section class="contract-section general-clauses">
        <h3>Cláusulas gerais e termos</h3>
        <p><strong>1. Objeto e vigência:</strong> O presente contrato tem por objeto a prestação de serviços estéticos pela CONTRATADA, incluindo os tratamentos descritos neste documento. A CONTRATANTE declara estar ciente de que as sessões contratadas devem ser utilizadas dentro do prazo de vigência deste contrato, salvo orientação diversa registrada pela profissional.</p>
        <p><strong>2. Agendamentos e faltas:</strong> As sessões serão realizadas mediante agendamento prévio. Atrasos, faltas ou cancelamentos em desacordo com a política da clínica poderão implicar perda da sessão, conforme previamente informado à CONTRATANTE.</p>
        <p><strong>3. Resultados:</strong> A CONTRATANTE declara ciência de que procedimentos estéticos apresentam resposta individual, podendo variar conforme idade, metabolismo, hábitos, cuidados domiciliares, condição clínica, aderência às orientações e características próprias do organismo.</p>
        <p><strong>4. Desistência:</strong> A desistência ou interrupção do tratamento não implica, por si só, devolução integral de valores. Caso haja necessidade de análise de reembolso, serão considerados procedimentos já realizados, produtos reservados/utilizados, custos administrativos e demais despesas relacionadas ao serviço contratado.</p>
        <p><strong>5. Anamnese e informações clínicas:</strong> A CONTRATANTE declara ter informado corretamente seus dados pessoais, histórico de saúde, uso de medicações, alergias, procedimentos anteriores, condições clínicas e demais informações relevantes para segurança do atendimento.</p>
        <p><strong>6. Consentimento e proteção de dados:</strong> A CONTRATANTE autoriza o tratamento dos seus dados pessoais e clínicos para fins de cadastro, prontuário, execução dos serviços, emissão de documentos, comunicação, organização interna, cumprimento de obrigações legais e acompanhamento pós-procedimento, nos termos da legislação aplicável.</p>
        <p><strong>7. Uso de imagem:</strong> Imagens clínicas poderão ser registradas para acompanhamento interno da evolução. O uso de imagem para divulgação externa somente deverá ocorrer mediante autorização específica da CONTRATANTE.</p>
      </section>

      <section class="contract-section">
        <h3>Especificações dos procedimentos</h3>
        <p class="muted">
          A CONTRATANTE declara estar ciente das indicações, contraindicações, possíveis efeitos colaterais e orientações pré e pós-procedimento aplicáveis ao(s) serviço(s) contratado(s).
        </p>
        ${specificTreatmentsHtml || "<p class='muted'><em>Orientações gerais repassadas pela profissional responsável.</em></p>"}
      </section>

      <section class="signature-section">
        <p class="signature-date">São Paulo, ${contractDate}</p>

        <div class="signature-grid">
          <div class="signature-line">
            <strong>${params.clinic.companyName}</strong><br/>
            Contratada
          </div>
          <div class="signature-line">
            <strong>${params.patient.name}</strong><br/>
            Contratante
          </div>
        </div>

        <div class="footer-note">
          Documento gerado pelo sistema de gestão da Mariana Thomaz Carmona.
        </div>
      </section>
    </div>
  `.trim();
}

