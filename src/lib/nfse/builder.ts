import { create } from "xmlbuilder2";

interface DpsInput {
    municipioIbge: string;
    serieDps?: string;
    numeroDps: string;
    dataEmissaoIso: string;

    prestadorCnpj: string;
    prestadorIM?: string;

    tomadorTipo: "CPF" | "CNPJ";
    tomadorDocumento: string;
    tomadorNome: string;
    tomadorEmail?: string;
    tomadorTelefone?: string;

    tomadorEndereco: {
        cep: string;
        logradouro: string;
        numero: string;
        bairro: string;
        codigoMunicipioIbge: string;
        uf: string;
    };

    descricaoServico: string;
    valorServicos: number;

    // MEI / sem ISS
    aliquota?: number;
    valorIss?: number;
}

export function buildDpsXml(input: DpsInput) {
    const {
        municipioIbge,
        serieDps = "1",
        numeroDps,
        dataEmissaoIso,
        prestadorCnpj,
        prestadorIM = "",
        tomadorTipo,
        tomadorDocumento,
        tomadorNome,
        tomadorEmail = "",
        tomadorTelefone = "",
        tomadorEndereco,
        descricaoServico,
        valorServicos,
        aliquota = 0,
        valorIss = 0,
    } = input;

    // Namespace oficial do padrão nacional (ajustar conforme versão vigente)
    // O padrão nacional geralmente usa xmlns="http://www.sped.fazenda.gov.br/nfse"
    // Mas confirmarei no XSD se necessário. Por hora, seguimos sem ns específico se a API aceitar,
    // ou adicionamos na raiz DPS. O user pediu ajuste de namespace.
    // Padrão Nacional XML DPS:
    const XMLNS = "http://www.sped.fazenda.gov.br/nfse";

    const doc = create({ version: "1.0", encoding: "UTF-8" })
        .ele("DPS", { xmlns: XMLNS, versao: "1.00" })
        .ele("infDPS", { Id: `DPS${numeroDps}` }) // ID para assinatura (opcional, mas bom pra XPATH)
        .ele("ide")
        .ele("cMun").txt(String(municipioIbge)).up()
        .ele("serie").txt(String(serieDps)).up()
        .ele("nDPS").txt(String(numeroDps)).up()
        .ele("dhEmi").txt(String(dataEmissaoIso)).up()
        .ele("tpAmb").txt("2").up() // 1=Produção, 2=Homologação (ajustar dinamicamente depois)
        .up()

        .ele("prest")
        .ele("CNPJ").txt(String(prestadorCnpj)).up()
        // .ele("IM").txt(String(prestadorIM)).up() // IM é opcional em alguns casos, manter se tiver
        .up()

        .ele("toma")
        .ele("xNome").txt(String(tomadorNome)).up()
        .ele("email").txt(String(tomadorEmail)).up()
        .ele("fone").txt(String(tomadorTelefone)).up();

    // Documento do tomador
    if (tomadorTipo === "CPF") {
        doc.ele("CPF").txt(String(tomadorDocumento)).up();
    } else {
        doc.ele("CNPJ").txt(String(tomadorDocumento)).up();
    }

    // Endereço
    doc.ele("ender")
        .ele("xLgr").txt(String(tomadorEndereco.logradouro)).up()
        .ele("nro").txt(String(tomadorEndereco.numero)).up()
        .ele("xBairro").txt(String(tomadorEndereco.bairro)).up()
        .ele("cMun").txt(String(tomadorEndereco.codigoMunicipioIbge)).up()
        .ele("UF").txt(String(tomadorEndereco.uf || "AM")).up()
        .ele("CEP").txt(String(tomadorEndereco.cep)).up()
        .up()
        .up(); // fim toma

    // Serviço
    doc.ele("serv")
        .ele("xDesc").txt(String(descricaoServico)).up()
        .ele("vServ").txt(Number(valorServicos).toFixed(2)).up()
        .up();

    // Tributos (MEI = zerado)
    doc.ele("trib")
        .ele("aliq").txt(Number(aliquota).toFixed(2)).up()
        .ele("vISS").txt(Number(valorIss).toFixed(2)).up()
        .ele("pISSRet").txt("0.00").up() // Sem retenção
        .up();

    // Retorna XML string
    return doc.end({ prettyPrint: false }); // Minificado para assinatura é mais seguro
}
