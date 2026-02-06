'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import './landing.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Scroll Reveal Logic
  useEffect(() => {
    const reveal = () => {
      var reveals = document.querySelectorAll(".reveal");
      for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        }
      }
    };
    window.addEventListener("scroll", reveal);
    reveal(); // Trigger once on load
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  // Feather Icons Replace
  const handleScriptLoad = () => {
    if ((window as any).feather) {
      (window as any).feather.replace();
    }
  };

  // Carousel Logic
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Tabeliã - Cartório Santiago",
      text: "A Feitosa Soluções transformou nossa infraestrutura de TI. O suporte é excepcional e sempre disponível quando precisamos. Recomendo fortemente!"
    },
    {
      name: "João Santos",
      role: "Gestor de TI - Cartório Itapiranga",
      text: "Profissionalismo e competência definem o trabalho da equipe. Nossos sistemas nunca estiveram tão estáveis e seguros. Parceria de confiança!"
    },
    {
      name: "Ana Oliveira",
      role: "Diretora - Cartório Zona Leste",
      text: "Atendimento rápido e eficiente. A equipe entende perfeitamente as necessidades específicas do setor cartorário. Excelente custo-benefício!"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if ((window as any).feather) (window as any).feather.replace();
  }, [currentSlide]);

  // Auto Rotate
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);


  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const company = (form.elements.namedItem('company') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

    const subject = encodeURIComponent('Contato via Site - ' + name);
    const body = encodeURIComponent(
      `Nome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nEmpresa: ${company || 'Não informado'}\n\nMensagem:\n${message}`
    );

    window.location.href = `mailto:iagofeitosa3@gmail.com?subject=${subject}&body=${body}`;
    alert('Seu cliente de email será aberto com a mensagem preenchida!');
    form.reset();
  };


  return (
    <>
      <Script src="https://unpkg.com/feather-icons" onLoad={handleScriptLoad} />

      {/* Header */}
      <header>
        <div className="container" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <nav>
            <a href="#" className="logo">
              <Image
                src="/assets/img/logo.png"
                alt="Feitosa Soluções Logo"
                width={50}
                height={50}
                style={{ height: '50px', width: 'auto' }}
              />
              <span>Feitosa Soluções</span>
            </a>
            <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
              <li><a href="#inicio" onClick={() => setMobileMenuOpen(false)}>Início</a></li>
              <li><a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a></li>
              <li><a href="#uteis" onClick={() => setMobileMenuOpen(false)}>Links Úteis</a></li>
              <li><a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre</a></li>
              <li><a href="#clientes" onClick={() => setMobileMenuOpen(false)}>Clientes</a></li>
              <li><a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a></li>
              <li><Link href="/login" style={{ color: 'var(--accent-color)' }}>Login</Link></li>
            </ul>
            <button className="mobile-menu-btn" aria-label="Abrir Menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i data-feather={mobileMenuOpen ? "x" : "menu"}></i>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div className="container">
          <div className="hero-content reveal active">
            <h1>Soluções em <span>Informática</span> para o seu Negócio</h1>
            <p>Tecnologia de ponta, segurança avançada e suporte especializado em Manaus e região.</p>
            <div className="hero-buttons" style={{ display: 'flex', gap: '10px' }}>
              <a href="#contato" className="btn">Solicitar Orçamento</a>
              <a href="#servicos" className="btn btn-outline">Nossos Serviços</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="features">
        <div className="container">
          <h2 className="section-title reveal">Nossos Serviços</h2>
          <div className="grid">
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="tool"></i></div>
              <h3>Manutenção Preventiva</h3>
              <p>Visitas periódicas para otimizar o desempenho, prevenir falhas e aumentar a vida útil dos seus equipamentos.</p>
            </div>
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="cpu"></i></div>
              <h3>Manutenção Corretiva</h3>
              <p>Identificação e resolução ágil de problemas técnicos para minimizar a inatividade e restaurar suas operações.</p>
            </div>
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="headphones"></i></div>
              <h3>Suporte Técnico</h3>
              <p>Assistência remota ou presencial especializada para esclarecer dúvidas e orientar seus usuários.</p>
            </div>
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="shield"></i></div>
              <h3>Gestão de Segurança de TI</h3>
              <p>Proteção robusta de dados e sistemas contra ameaças virtuais, garantindo a integridade da sua informação.</p>
            </div>
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="trending-up"></i></div>
              <h3>Consultoria em TI</h3>
              <p>Orientação estratégica para aquisição e implementação de novas tecnologias alinhadas ao seu negócio.</p>
            </div>
            <div className="card glass reveal">
              <div className="card-icon"><i data-feather="code"></i></div>
              <h3>Desenvolvimento Web</h3>
              <p>Criação de sites profissionais, sistemas web sob medida e lojas virtuais com design moderno e alta performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="about">
        <div className="container">
          <h2 className="section-title reveal">Sobre Nós</h2>
          <div className="about-content">
            <div className="about-story reveal">
              <div className="about-intro">
                <h3>Nossa História</h3>
                <p>Fundada em <strong>2019</strong>, a <strong>Feitosa Soluções em Informática</strong> nasceu com o propósito de transformar a experiência tecnológica de empresas em Manaus e região.</p>
                <p>Com uma equipe altamente qualificada e certificada, oferecemos soluções completas em infraestrutura de TI, desde suporte técnico especializado até implementação de redes corporativas e servidores de alta disponibilidade.</p>
                <p>Ao longo dos anos, nos consolidamos como <strong>parceiros estratégicos de cartórios</strong>, entendendo as necessidades específicas deste setor que exige máxima segurança, disponibilidade e conformidade legal.</p>
              </div>
              <div className="about-stats">
                <div className="stat-item glass"><i data-feather="users"></i><div className="stat-content"><h4>15+</h4><p>Clientes Ativos</p></div></div>
                <div className="stat-item glass"><i data-feather="clock"></i><div className="stat-content"><h4>6 Anos</h4><p>de Experiência</p></div></div>
                <div className="stat-item glass"><i data-feather="check-circle"></i><div className="stat-content"><h4>99.9%</h4><p>Disponibilidade</p></div></div>
                <div className="stat-item glass"><i data-feather="zap"></i><div className="stat-content"><h4>24/7</h4><p>Suporte Disponível</p></div></div>
              </div>
            </div>

            <div className="about-pillars reveal">
              <div className="about-card glass">
                <div className="card-header"><i data-feather="target"></i><h3>Missão</h3></div>
                <p>Prover soluções de TI ágeis, seguras e personalizadas, impulsionando a produtividade e o crescimento sustentável dos nossos clientes através de tecnologia de ponta e atendimento humanizado.</p>
              </div>
              <div className="about-card glass">
                <div className="card-header"><i data-feather="eye"></i><h3>Visão</h3></div>
                <p>Ser reconhecida como a principal referência em suporte técnico e infraestrutura de TI em Manaus e região, expandindo nossa atuação e mantendo a excelência no atendimento.</p>
              </div>
              <div className="about-card glass">
                <div className="card-header"><i data-feather="award"></i><h3>Valores</h3></div>
                <ul className="values-list">
                  <li><i data-feather="check"></i> <strong>Ética:</strong> Transparência em todas as relações</li>
                  <li><i data-feather="check"></i> <strong>Comprometimento:</strong> Dedicação total aos projetos</li>
                  <li><i data-feather="check"></i> <strong>Inovação:</strong> Busca constante por melhorias</li>
                  <li><i data-feather="check"></i> <strong>Excelência:</strong> Qualidade em cada entrega</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-expertise reveal">
            <h3>Nossa Expertise</h3>
            <div className="expertise-grid">
              <div className="expertise-item"><i data-feather="server"></i><h4>Infraestrutura</h4><p>Servidores, redes e storage empresarial</p></div>
              <div className="expertise-item"><i data-feather="shield"></i><h4>Segurança</h4><p>Firewall, backup e proteção de dados</p></div>
              <div className="expertise-item"><i data-feather="cloud"></i><h4>Cloud Computing</h4><p>Migração e gestão de ambientes cloud</p></div>
              <div className="expertise-item"><i data-feather="database"></i><h4>Banco de Dados</h4><p>Administração e otimização de DBs</p></div>
              <div className="expertise-item"><i data-feather="wifi"></i><h4>Redes</h4><p>Cabeamento estruturado e Wi-Fi</p></div>
              <div className="expertise-item"><i data-feather="life-buoy"></i><h4>Suporte</h4><p>Atendimento remoto e presencial</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Useful Links Section */}
      <section id="uteis" className="useful-links">
        <div className="container">
          <h2 className="section-title reveal">Links Úteis</h2>
          <div className="links-grid reveal">
            <a href="https://www.tjam.jus.br/" target="_blank" className="link-card">
              <i data-feather="external-link" style={{ color: 'var(--accent-color)' }}></i>
              <span>TJAM - Tribunal de Justiça</span>
            </a>
            <a href="https://www.cnj.jus.br/" target="_blank" className="link-card">
              <i data-feather="book-open" style={{ color: 'var(--accent-color)' }}></i>
              <span>CNJ - Conselho Nacional</span>
            </a>
            <a href="https://www.anoreg.org.br/site/" target="_blank" className="link-card">
              <i data-feather="file-text" style={{ color: 'var(--accent-color)' }}></i>
              <span>ANOREG - Assoc. Notários</span>
            </a>
            <a href="https://suporte.feitosa.com" target="_blank" className="link-card">
              <i data-feather="monitor" style={{ color: 'var(--accent-color)' }}></i>
              <span>Acesso Remoto / Suporte</span>
            </a>
            <Link href="/financeiro" className="link-card">
              <i data-feather="dollar-sign" style={{ color: 'var(--accent-color)' }}></i>
              <span>Sistema Financeiro</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="parceiros" className="partners">
        <div className="container">
          <h2 className="section-title reveal">Nossos Parceiros</h2>
          <div className="partners-grid reveal">
            <div className="partner-card glass">
              <div className="partner-logo dell" title="Dell Technologies"><span>DELL</span></div>
              <p>Servidores e Workstations</p>
            </div>
            <div className="partner-card glass">
              <div className="partner-logo lenovo" title="Lenovo"><span>Lenovo</span></div>
              <p>Computadores e Notebooks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clientes" className="clients">
        <div className="container">
          <h2 className="section-title reveal">Nossos Clientes</h2>
          <div className="marquee reveal">
            <div className="marquee-track">
              {/* Placeholder for logos since we don't have the assets, using text fallbacks if images fail */}
              <div className="client-logo">Cartório Santiago</div>
              <div className="client-logo">Cartório Itapiranga</div>
              <div className="client-logo">2º Ofício Manacapuru</div>
              <div className="client-logo">Zona Leste</div>
              <div className="client-logo">Cartório Suzuki</div>
              {/* Duplicate for marquee */}
              <div className="client-logo">Cartório Santiago</div>
              <div className="client-logo">Cartório Itapiranga</div>
              <div className="client-logo">2º Ofício Manacapuru</div>
              <div className="client-logo">Zona Leste</div>
              <div className="client-logo">Cartório Suzuki</div>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section id="depoimentos" className="testimonials">
        <div className="container">
          <h2 className="section-title reveal">O Que Nossos Clientes Dizem</h2>
          <div className="testimonials-carousel reveal">
            <div className="testimonial-track">
              <div className="testimonial-card glass active">
                <div className="stars"><i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i><i data-feather="star"></i></div>
                <p className="testimonial-text">"{testimonials[currentSlide].text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar"><i data-feather="user"></i></div>
                  <div className="author-info">
                    <h4>{testimonials[currentSlide].name}</h4>
                    <p>{testimonials[currentSlide].role}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-controls">
              <button className="carousel-btn prev" onClick={prevSlide} aria-label="Anterior"><i data-feather="chevron-left"></i></button>
              <div className="carousel-dots">
                {testimonials.map((_, idx) => (
                  <span key={idx} className={`dot ${currentSlide === idx ? 'active' : ''}`} onClick={() => setCurrentSlide(idx)}></span>
                ))}
              </div>
              <button className="carousel-btn next" onClick={nextSlide} aria-label="Próximo"><i data-feather="chevron-right"></i></button>
            </div>
          </div>
        </div>
      </section>


      {/* Contact Section */}
      <section id="contato" className="contact">
        <div className="container">
          <h2 className="section-title reveal">Entre em Contato</h2>
          <div className="contact-content reveal">
            <div className="contact-form-wrapper glass">
              <h3>Envie sua Mensagem</h3>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="name">Nome Completo *</label><input type="text" id="name" name="name" required placeholder="Seu nome" /></div>
                  <div className="form-group"><label htmlFor="email">E-mail *</label><input type="email" id="email" name="email" required placeholder="seu@email.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="phone">Telefone *</label><input type="tel" id="phone" name="phone" required placeholder="(00) 00000-0000" /></div>
                  <div className="form-group"><label htmlFor="company">Empresa</label><input type="text" id="company" name="company" placeholder="Nome da empresa" /></div>
                </div>
                <div className="form-group"><label htmlFor="message">Mensagem *</label><textarea id="message" name="message" rows={5} required placeholder="Como podemos ajudar?"></textarea></div>
                <button type="submit" className="btn"><i data-feather="send" style={{ marginRight: '8px' }}></i> Enviar Mensagem</button>
              </form>
            </div>
            <div className="contact-info-wrapper">
              <div className="contact-info-card glass">
                <h3>Informações de Contato</h3>
                <div className="contact-item"><i data-feather="phone"></i><div><h4>Telefone/WhatsApp</h4><p>(92) 98459-6890</p></div></div>
                <div className="contact-item"><i data-feather="mail"></i><div><h4>E-mail</h4><p>iagofeitosa3@gmail.com</p></div></div>
                <div className="contact-item"><i data-feather="clock"></i><div><h4>Horário de Atendimento</h4><p>Segunda a Sexta: 8h às 18h</p><p>Suporte 24/7 disponível</p></div></div>
                <div className="contact-buttons">
                  <a href="https://wa.me/5592984596890" target="_blank" className="btn"><i data-feather="message-circle" style={{ marginRight: '8px' }}></i> WhatsApp</a>
                  <a href="mailto:iagofeitosa3@gmail.com" className="btn btn-outline"><i data-feather="mail" style={{ marginRight: '8px' }}></i> E-mail</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="logo-footer">
              {/* <img src="assets/img/logo-full-light.png" alt="Feitosa Soluções Logo Completa" /> */}
              <h2 style={{ color: 'white' }}>⚡ FEITOSA SOLUÇÕES</h2>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <Link href="/termos" style={{ color: 'var(--text-muted)' }} className="hover:text-white">Termos de Uso</Link>
              <Link href="/privacidade" style={{ color: 'var(--text-muted)' }} className="hover:text-white">Política de Privacidade (LGPD)</Link>
            </div>
            <p>&copy; 2026 Feitosa Soluções em Informática. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <a href="https://wa.me/5592984596890?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento." target="_blank" className="whatsapp-float" aria-label="Falar no WhatsApp" title="Fale conosco no WhatsApp">
        <i data-feather="message-circle"></i>
      </a>
    </>
  );
}
