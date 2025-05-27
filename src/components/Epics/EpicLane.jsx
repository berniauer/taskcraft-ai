// src/components/Epics/EpicLane.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Layers } from 'lucide-react'; // Layers für Epic-Icon

const EpicLane = ({ boardId, onEpicSelect, activeEpicId }) => {
  const { userId } = useAuth();
  const [epics, setEpics] = useState([]);
  const [loadingEpics, setLoadingEpics] = useState(true);
  const [selectedEpicDetails, setSelectedEpicDetails] = useState(null);

  useEffect(() => {
    const fetchEpics = async () => {
      if (!boardId || !userId) {
        setLoadingEpics(false);
        return;
      }
      setLoadingEpics(true);
      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, title, description') // Nur benötigte Felder für die Lane
          .eq('board_id', boardId)
          .eq('user_id', userId)
          .eq('item_type', 'epic')
          .order('created_at', { ascending: true }); // oder nach 'title'

        if (error) throw error;
        setEpics(data || []);
      } catch (error) {
        console.error('Fehler beim Laden der Epics:', error);
        // Hier könntest du einen Toast anzeigen
      } finally {
        setLoadingEpics(false);
      }
    };

    fetchEpics();
  }, [boardId, userId]);

  useEffect(() => {
    // Details des ausgewählten Epics setzen
    if (activeEpicId) {
      const details = epics.find(e => e.id === activeEpicId);
      setSelectedEpicDetails(details || null);
    } else {
      setSelectedEpicDetails(null);
    }
  }, [activeEpicId, epics]);

  if (loadingEpics) {
    return (
      <div className="p-4 flex items-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Lade Epics...
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-slate-800/70 backdrop-blur-md rounded-lg shadow-lg">
      <div className="flex items-center mb-3">
        <Layers size={20} className="mr-2 text-purple-400" />
        <h2 className="text-xl font-semibold text-purple-300">Epics</h2>
      </div>
      {epics.length === 0 && !loadingEpics && (
        <p className="text-slate-400 text-sm">Dieses Board hat noch keine Epics.</p>
      )}
      
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        <Button
          variant={!activeEpicId ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onEpicSelect(null)}
          className={`flex-shrink-0 ${!activeEpicId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-slate-600 hover:bg-slate-700 text-slate-300'}`}
        >
          Alle anzeigen
        </Button>
        {epics.map((epic) => (
          <Button
            key={epic.id}
            variant={activeEpicId === epic.id ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onEpicSelect(epic.id)}
            className={`flex-shrink-0 ${activeEpicId === epic.id ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-slate-600 hover:bg-slate-700 text-slate-300'}`}
            title={epic.title}
          >
            {epic.title.length > 25 ? epic.title.substring(0, 22) + '...' : epic.title}
          </Button>
        ))}
      </div>

      {/* Bereich für Epic-Details (basierend auf Mockup) */}
      {activeEpicId && selectedEpicDetails && (
        <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
          <h3 className="text-lg font-medium text-purple-200 mb-1">{selectedEpicDetails.title}</h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">
            {selectedEpicDetails.description || 'Keine Beschreibung vorhanden.'}
          </p>
          {/* Hier könnte später ein Fortschrittsbalken oder andere Details hinzukommen */}
        </div>
      )}
       {!activeEpicId && epics.length > 0 && (
         <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600 text-center text-slate-400">
            <p>Wählen Sie ein Epic aus, um Details anzuzeigen und die Aufgaben zu filtern.</p>
        </div>
       )}
    </div>
  );
};

export default EpicLane;