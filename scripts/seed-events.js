#!/usr/bin/env node

/**
 * Script para popular eventos com dados UTM realistas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY; // Use service role for inserts

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Campanhas UTM realistas
const campaigns = [
  { source: 'google', medium: 'cpc', campaign: 'black_friday_2024', content: 'banner_principal', term: 'teste ab' },
  { source: 'facebook', medium: 'social', campaign: 'lancamento_produto', content: 'carousel', term: null },
  { source: 'instagram', medium: 'social', campaign: 'influencer_maria', content: 'stories', term: null },
  { source: 'email', medium: 'email', campaign: 'newsletter_dezembro', content: 'cta_principal', term: null },
  { source: 'google', medium: 'organic', campaign: null, content: null, term: 'ferramenta teste ab' },
  { source: 'youtube', medium: 'video', campaign: 'tutorial_completo', content: 'descricao', term: null },
  { source: 'linkedin', medium: 'social', campaign: 'webinar_gratis', content: 'post_patrocinado', term: null },
  { source: 'twitter', medium: 'social', campaign: 'lancamento', content: 'tweet_pinado', term: null },
  { source: 'pinterest', medium: 'social', campaign: 'visual_inspiration', content: 'pin_promocional', term: null },
  { source: 'tiktok', medium: 'social', campaign: 'viral_challenge', content: 'video_curto', term: null },
];

const eventNames = [
  'page_view',
  'button_click',
  'form_submit',
  'add_to_cart',
  'purchase_completed',
  'signup_completed',
  'video_watched',
  'download_started',
  'trial_started',
  'demo_requested'
];

const devices = ['desktop', 'mobile', 'tablet'];
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const oses = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'];
const countries = ['Brazil', 'United States', 'Canada', 'United Kingdom', 'Germany'];
const cities = {
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte', 'Curitiba'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne']
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getEventType(eventName) {
  if (eventName.includes('view')) return 'page_view';
  if (eventName.includes('click')) return 'click';
  if (eventName.includes('completed') || eventName.includes('purchase')) return 'conversion';
  return 'custom';
}

async function seedEvents() {
  console.log('🌱 Populando eventos com dados UTM...\n');

  try {
    // Buscar experimento existente
    const { data: experiments, error: expError } = await supabase
      .from('experiments')
      .select('id, name')
      .limit(1);

    if (expError) throw expError;

    if (!experiments || experiments.length === 0) {
      console.log('⚠️  Nenhum experimento encontrado. Criando eventos sem experiment_id.');
    }

    const experimentId = experiments && experiments[0] ? experiments[0].id : null;
    const eventsToInsert = [];

    // Gerar 100 eventos variados
    const now = new Date();
    for (let i = 0; i < 100; i++) {
      const campaign = randomItem(campaigns);
      const eventName = randomItem(eventNames);
      const eventType = getEventType(eventName);
      const country = randomItem(countries);
      const device = randomItem(devices);

      // Visitantes recorrentes (alguns visitor_ids se repetem)
      const visitorId = `visitor_${Math.floor(Math.random() * 30)}`;

      // Eventos mais recentes têm timestamp mais próximo de agora
      const hoursAgo = Math.floor(Math.random() * (24 * 7)); // últimos 7 dias
      const createdAt = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

      const event = {
        experiment_id: experimentId,
        variant_id: null, // Pode ser null para eventos sem variante
        visitor_id: visitorId,
        event_name: eventName,
        event_type: eventType,
        event_data: {
          url: `https://exemplo.com/${eventName.replace('_', '-')}`,
          title: `Página ${eventName}`,
          device_type: device,
          browser: randomItem(browsers),
          os: randomItem(oses),
          viewport: { width: 1920, height: 1080 },
          timestamp: createdAt.toISOString()
        },
        utm_data: {
          utm_source: campaign.source,
          utm_medium: campaign.medium,
          utm_campaign: campaign.campaign,
          utm_content: campaign.content,
          utm_term: campaign.term
        },
        value: eventType === 'conversion' ? (Math.random() * 500 + 50) : null,
        created_at: createdAt.toISOString()
      };

      eventsToInsert.push(event);
    }

    // Inserir em lotes de 50
    const batchSize = 50;
    for (let i = 0; i < eventsToInsert.length; i += batchSize) {
      const batch = eventsToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('events')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, error.message);
        console.error('   Detalhes:', error.details);
      } else {
        console.log(`✅ Lote ${i / batchSize + 1} inserido: ${data.length} eventos`);
      }
    }

    console.log('\n✨ Seed concluído!');
    console.log(`   Total de eventos inseridos: ${eventsToInsert.length}`);

    // Mostrar resumo
    const { data: stats } = await supabase
      .from('events')
      .select('event_type', { count: 'exact' });

    const typeCounts = {};
    stats?.forEach(e => {
      typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
    });

    console.log('\n📊 Resumo de eventos no banco:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  } catch (err) {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  }
}

seedEvents();
