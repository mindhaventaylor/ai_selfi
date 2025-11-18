export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos as seguintes informações quando você usa o AISelfi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Informações de conta: nome, e-mail e método de login</li>
              <li>Fotos enviadas: selfies que você fornece para processamento</li>
              <li>Dados de pagamento: processados de forma segura por nossos parceiros</li>
              <li>Dados de uso: como você interage com nossa plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Processar suas fotos usando nossa tecnologia de IA</li>
              <li>Gerenciar sua conta e fornecer suporte ao cliente</li>
              <li>Processar pagamentos e prevenir fraudes</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Enviar atualizações importantes sobre o serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Suas fotos são armazenadas de forma segura em servidores criptografados. Implementamos medidas de 
              segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda 
              ou alteração. Suas fotos originais são mantidas apenas pelo tempo necessário para o processamento 
              e podem ser excluídas mediante solicitação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Provedores de serviços que nos ajudam a operar a plataforma</li>
              <li>Processadores de pagamento para transações financeiras</li>
              <li>Autoridades legais quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você tem o direito de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incorretos ou incompletos</li>
              <li>Solicitar a exclusão de suas fotos e dados</li>
              <li>Exportar seus dados em formato legível</li>
              <li>Retirar consentimento para processamento de dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site 
              e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através das configurações 
              do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações apenas pelo tempo necessário para fornecer nossos serviços e cumprir 
              obrigações legais. Fotos processadas são armazenadas em sua conta até que você decida excluí-las.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças 
              significativas por e-mail ou através de aviso em nosso site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato conosco através 
              dos canais disponíveis em nosso site.
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
