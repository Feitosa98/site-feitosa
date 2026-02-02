'use client';

import '../landing.css';
import Link from 'next/link';

export default function TermsPage() {
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
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Termos de Uso
                    </h1>

                    <div className="legal-content" style={{ lineHeight: '1.8', color: 'var(--text-muted)' }}>
                        <p><strong>Última atualização: 02 de Fevereiro de 2026</strong></p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>1. Aceitação dos Termos</h3>
                        <p>Ao acessar e utilizar os serviços da <strong>Feitosa Soluções em Informática</strong>, você concorda expressamente com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>2. Descrição dos Serviços</h3>
                        <p>A Feitosa Soluções fornece serviços de consultoria em TI, suporte técnico, desenvolvimento de software e infraestrutura de redes. Nossas plataformas online (Portal do Cliente) permitem o gerenciamento de chamados, visualização de faturas e acesso a documentos técnicos.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>3. Cadastro e Segurança</h3>
                        <p>Para acessar áreas restritas, você deve fornecer informações precisas e completas. Você é responsável por manter a confidencialidade de suas credenciais de acesso (usuário e senha) e por todas as atividades que ocorram em sua conta.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>4. Uso Aceitável</h3>
                        <p>Você concorda em não utilizar nossos serviços para:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Violar leis locais, estaduais ou federais.</li>
                            <li>Transmitir códigos maliciosos, vírus ou qualquer software prejudicial.</li>
                            <li>Tentar obter acesso não autorizado a sistemas ou redes da Feitosa Soluções.</li>
                        </ul>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>5. Propriedade Intelectual</h3>
                        <p>Todo o conteúdo presente neste site e em nossos sistemas, incluindo logotipos, textos, gráficos e códigos, é propriedade exclusiva da Feitosa Soluções ou de seus licenciadores e está protegido por leis de direitos autorais.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>6. Limitação de Responsabilidade</h3>
                        <p>A Feitosa Soluções não será responsável por danos indiretos, incidentais ou consequentes decorrentes do uso ou da incapacidade de usar nossos serviços, incluindo, mas não se limitando a, perda de dados ou interrupção de negócios.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>7. Alterações nos Termos</h3>
                        <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site. O uso contínuo dos serviços após as alterações constitui aceitação dos novos termos.</p>

                        <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>8. Contato</h3>
                        <p>Dúvidas sobre estes termos podem ser enviadas para: <strong>iagofeitosa3@gmail.com</strong></p>
                    </div>
                </div>
            </main>

            <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <p>&copy; 2026 Feitosa Soluções. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
