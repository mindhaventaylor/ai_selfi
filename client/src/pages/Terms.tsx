export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Termos de Serviço</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o AISelfi, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
              Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O AISelfi é uma plataforma que utiliza inteligência artificial para gerar fotos profissionais a partir 
              de selfies fornecidas pelos usuários. Oferecemos diferentes pacotes de fotos com diversos estilos disponíveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Uso das Imagens</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ao enviar suas fotos para o AISelfi, você:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Garante que possui todos os direitos sobre as imagens enviadas</li>
              <li>Concede ao AISelfi licença para processar suas imagens usando IA</li>
              <li>Mantém todos os direitos de propriedade sobre as fotos geradas</li>
              <li>Concorda que não usará o serviço para conteúdo ilegal ou ofensivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Privacidade e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Levamos sua privacidade a sério. Suas fotos são processadas de forma segura e não são compartilhadas 
              com terceiros. Consulte nossa Política de Privacidade para mais detalhes sobre como tratamos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Pagamentos e Reembolsos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Todos os pagamentos são processados de forma segura. Nossa política de reembolso:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Reembolso total se houver falha técnica em nosso serviço</li>
              <li>Não oferecemos reembolsos por insatisfação com resultados subjetivos</li>
              <li>Processamento de reembolsos em até 7 dias úteis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O AISelfi não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso 
              ou incapacidade de usar nossos serviços. As fotos geradas são criadas por IA e podem não atender 
              perfeitamente às expectativas de todos os usuários.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre 
              mudanças significativas por e-mail ou através de aviso em nosso site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre estes Termos de Serviço, entre em contato conosco através do WhatsApp ou e-mail 
              disponíveis em nosso site.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-12">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
