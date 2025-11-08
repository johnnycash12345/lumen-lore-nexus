import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UniversePage } from './UniversePage';
import { CharacterPage } from './CharacterPage';
import { LocationPage } from './LocationPage';
import { EventPage } from './EventPage';

export function DynamicPageLoader() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setPageData(data);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !pageData) {
    return <Navigate to="/404" replace />;
  }

  switch (pageData.entity_type) {
    case 'UNIVERSE':
      return <UniversePage universeId={pageData.entity_id} />;
    case 'CHARACTER':
      return <CharacterPage characterId={pageData.entity_id} />;
    case 'LOCATION':
      return <LocationPage locationId={pageData.entity_id} />;
    case 'EVENT':
      return <EventPage eventId={pageData.entity_id} />;
    default:
      return <Navigate to="/404" replace />;
  }
}
