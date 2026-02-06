import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { nanoid } from 'nanoid';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const report = await request.json();
    const id = nanoid(10);

    const { error } = await supabase
      .from('audit_reports')
      .insert({
        id,
        overall_score: report.overallScore,
        ratings: report.ratings,
        section_results: report.sectionResults,
        key_takeaways: report.keyTakeaways,
      });

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save report' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ id, url: `/audit/${id}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Report save error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to save report' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ url }) => {
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Report ID required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        createdAt: data.created_at,
        overallScore: data.overall_score,
        ratings: data.ratings,
        sectionResults: data.section_results,
        keyTakeaways: data.key_takeaways,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Report fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch report' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
