import Link from "next/link";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-neutral-100">{titulo}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-neutral-300">{children}</div>
    </section>
  );
}

function APreencher({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-none bg-amber-950 px-1.5 py-0.5 font-medium text-amber-400 ring-1 ring-amber-800">
      [A confirmar: {children}]
    </span>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:max-w-2xl md:px-6 md:py-12">
      <Link href="/" className="mb-4 inline-block text-sm font-medium text-muted underline">
        ← Voltar
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-neutral-100">Política de Privacidade</h1>
      <p className="mb-6 text-xs text-muted">Última atualização: 25 de setembro de 2026.</p>

      <div className="space-y-6">
        <Secao titulo="Quem trata os teus dados">
          <p>
            Esta aplicação (CFA Avaliações) é usada pela CrossFit Alvalade para avaliar o desempenho da sua equipa
            técnica. A CrossFit Alvalade é a responsável pelo tratamento dos dados recolhidos.
          </p>
          <p>
            Contacto para questões de privacidade:{" "}
            <APreencher>email ou pessoa de contacto para pedidos de privacidade</APreencher>.
          </p>
        </Secao>

        <Secao titulo="Que dados tratamos">
          <p>Dependendo do teu papel na aplicação (treinador, avaliador ou administrador), tratamos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Dados de identificação e conta: nome e email de acesso.</li>
            <li>Dados de sessão e segurança: histórico de logins, tentativas de acesso falhadas.</li>
            <li>
              Dados de avaliação de desempenho: respostas à grelha de avaliação, classificação geral, comentários em
              texto livre, plano de ação — sempre associados ao nome do treinador avaliado e do avaliador.
            </li>
            <li>
              Registo de atividade: ações relevantes realizadas na aplicação (por exemplo, quem viu ou criou uma
              avaliação, quem exportou dados, alterações de password), para efeitos de segurança e auditoria.
            </li>
          </ul>
          <p>Não recolhemos dados de saúde, biométricos ou outras categorias especiais de dados.</p>
        </Secao>

        <Secao titulo="Para que finalidades">
          <p>
            Os dados são tratados para gerir e documentar o desempenho da equipa técnica da CrossFit Alvalade,
            permitir o acompanhamento e desenvolvimento profissional dos treinadores, e garantir a segurança e
            integridade da aplicação (prevenção de acessos indevidos, auditoria de ações administrativas).
          </p>
        </Secao>

        <Secao titulo="Base legal">
          <p>
            O tratamento assenta na execução do contrato ou vínculo profissional entre a CrossFit Alvalade e cada
            membro da equipa técnica, e no interesse legítimo da CrossFit Alvalade em gerir e desenvolver a sua
            equipa. Não pedimos consentimento para este tratamento, porque decorre diretamente da relação
            profissional — mas tens sempre o direito de te opor ou pedir esclarecimentos (ver secção seguinte).
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos os dados">
          <p>
            Os dados de conta e de avaliação são conservados enquanto durar a relação profissional com a CrossFit
            Alvalade, e por um período adicional de <APreencher>prazo de conservação após o fim do vínculo (ex.: 3 anos)</APreencher>{" "}
            depois de terminada, salvo se a lei exigir um prazo diferente.
          </p>
          <p>
            O registo de atividade (logins e ações de segurança) é apagado automaticamente ao fim de 12 meses.
          </p>
        </Secao>

        <Secao titulo="Quem tem acesso aos dados">
          <p>
            Dentro da CrossFit Alvalade, só administradores e avaliadores (head coaches) têm acesso às avaliações de
            um treinador; cada treinador só vê as suas próprias avaliações.
          </p>
          <p>
            Os dados estão alojados num fornecedor de alojamento externo (base de dados), atualmente{" "}
            <APreencher>nome do fornecedor de alojamento e país onde os dados ficam guardados</APreencher>. Este
            fornecedor trata os dados apenas por nossa conta, como subcontratante.
          </p>
        </Secao>

        <Secao titulo="Os teus direitos">
          <p>Tens direito a, a qualquer momento:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Aceder aos dados que temos sobre ti — podes descarregá-los diretamente em &ldquo;O meu perfil&rdquo;.</li>
            <li>Pedir a correção de dados incorretos ou desatualizados.</li>
            <li>Pedir o apagamento (anonimização) da tua conta, quando a relação profissional terminar.</li>
            <li>Opor-te a um tratamento específico, ou pedir a limitação do tratamento.</li>
            <li>Pedir a portabilidade dos teus dados num formato estruturado (o mesmo ficheiro de &ldquo;O meu perfil&rdquo;).</li>
          </ul>
          <p>
            Para exercer qualquer um destes direitos, contacta{" "}
            <APreencher>email ou pessoa de contacto para pedidos de privacidade</APreencher>.
          </p>
        </Secao>

        <Secao titulo="Segurança">
          <p>
            As palavras-passe são guardadas de forma cifrada (nunca em texto simples), o acesso à aplicação é
            protegido por sessão e bloqueado ao fim de várias tentativas de login falhadas, e cada área só é
            acessível a quem tem o papel adequado. Ações relevantes ficam registadas para deteção de acessos
            indevidos.
          </p>
        </Secao>

        <Secao titulo="Reclamações">
          <p>
            Se achares que os teus dados não estão a ser tratados corretamente, podes apresentar reclamação junto da
            Comissão Nacional de Proteção de Dados (CNPD) — www.cnpd.pt.
          </p>
        </Secao>
      </div>
    </div>
  );
}
