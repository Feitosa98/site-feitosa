'use client';

import '../landing.css';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        ⚡ Feitosa Soluções
                    </Link>
                    <Link href="/" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Voltar</Link>
                </div>
            </header>

            <main className="container" style={{ padding: '4rem 0' }}>
                <div className="card glass" style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Política de Privacidade e LGPD
                    </h1>

                    <div className="legal-content" style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>
                        <p><strong>Última atualização: 02 de Fevereiro de 2026</strong></p>
                        <p>A <strong>Feitosa Soluções</strong> está comprometida com a proteção dos seus dados pessoais e com a transparência sobre como os tratamos, em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>1. Coleta de Dados</h3>
                        <p>Coletamos apenas os dados essenciais para a prestação de nossos serviços, que podem incluir:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li><strong>Dados Pessoais:</strong> Nome, CPF, e-mail e telefone para cadastro e contato.</li>
                            <li><strong>Dados Empresariais:</strong> CNPJ, Razão Social e Endereço para emissão de notas fiscais e contratos.</li>
                            <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador e logs de acesso para segurança e melhoria do sistema.</li>
                        </ul>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>2. Finalidade do Tratamento</h3>
                        <p>Seus dados são utilizados para:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Prestação dos serviços contratados (suporte, consultoria, etc).</li>
                            <li>Emissão de Notas Fiscais e cobranças.</li>
                            <li>Comunicação sobre atualizações, manutenções ou suporte.</li>
                            <li>Cumprimento de obrigações legais e regulatórias.</li>
                        </ul>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>3. Compartilhamento de Dados</h3>
                        <p>A Feitosa Soluções não vende seus dados. O compartilhamento ocorre apenas quando necessário para:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Processamento de pagamentos junto a instituições financeiras.</li>
                            <li>Emissão de documentos fiscais junto a órgãos governamentais (Prefeituras, Receita Federal).</li>
                            <li>Hospedagem de dados em provedores de nuvem seguros (ex: AWS, Google Cloud).</li>
                        </ul>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>4. Seus Direitos (LGPD)</h3>
                        <p>Como titular dos dados, você tem direito a:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Confirmar a existência de tratamento de dados.</li>
                            <li>Acessar seus dados.</li>
                            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                            <li>Revogar seu consentimento a qualquer momento.</li>
                        </ul>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>5. Segurança da Informação</h3>
                        <p>Adotamos medidas técnicas e administrativas robustas para proteger seus dados contra acessos não autorizados, perdas ou alterações, incluindo criptografia e controle de acesso rigoroso.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>6. Encarregado de Dados (DPO)</h3>
                        <p>Para exercer seus direitos ou tirar dúvidas sobre nossa política de privacidade, entre em contato com nosso Encarregado de Proteção de Dados:</p>
                        <p style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <strong>E-mail:</strong> iagofeitosa3@gmail.com<br />
                            <strong>Assunto:</strong> LGPD / Privacidade
                        </p>
                    </div>
                </div>
            </main>

            <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <p>&copy; 2026 Feitosa Soluções. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
