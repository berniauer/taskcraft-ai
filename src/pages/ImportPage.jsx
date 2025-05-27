import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { UploadCloud, Copy, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const expectedJsonStructure = `{
  "boardName": "Optional: Name des Ziel-Boards",
  "items": [
    {
      "type": "epic",
      "title": "Titel des Epics",
      "description": "Beschreibung des Epics...",
      "tags": ["Tag1", "OptionalTag2"],
      "stories": [
        {
          "type": "story",
          "title": "Titel der Story",
          "description": "Beschreibung der Story...",
          "tags": ["TagA"],
          "tasks": [
            {
              "type": "task",
              "title": "Titel des Tasks",
              "description": "Beschreibung des Tasks...",
              "tags": []
            }
          ]
        }
      ]
    }
  ]
}`;

// Rekursive Hilfsfunktion für den Import (außerhalb der Komponente, da sie keinen Hook-Zugriff benötigt, außer supabase)
const importItemRecursive = async (itemData, boardId, columnId, currentUserId, parentId = null, importErrors, incrementSuccessCount, incrementErrorCount) => {
  try {
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('items')
      .select('order_index')
      .eq('board_id', boardId)
      .eq('column_id', columnId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (maxOrderError) throw maxOrderError;
    const newOrderIndex = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order_index + 1 : 0;

    const itemType = itemData.type?.toLowerCase();
    if (!['epic', 'story', 'task'].includes(itemType)) {
      console.warn(`Ungültiger Item-Typ "${itemData.type}" für Item "${itemData.title}". Übersprungen.`);
      importErrors.push(`Ungültiger Typ für Item "${itemData.title}"`);
      incrementErrorCount();
      return;
    }

    const newItemPayload = {
      board_id: boardId,
      column_id: columnId,
      user_id: currentUserId,
      title: itemData.title,
      description: itemData.description || null,
      item_type: itemType,
      parent_item_id: parentId,
      order_index: newOrderIndex,
      tags_text_array: itemData.tags && Array.isArray(itemData.tags) ? itemData.tags : null,
    };

    const { data: insertedItem, error: insertError } = await supabase
      .from('items')
      .insert(newItemPayload)
      .select('id')
      .single();

    if (insertError) throw insertError; // Wichtig: Fehler hier werfen, damit er im äußeren try/catch gefangen wird
    incrementSuccessCount();
    console.log(`Item "${newItemPayload.title}" importiert mit ID: ${insertedItem.id}`);

    let childrenToImport = [];
    if (itemType === 'epic' && itemData.stories && Array.isArray(itemData.stories)) {
      childrenToImport = itemData.stories;
    } else if (itemType === 'story' && itemData.tasks && Array.isArray(itemData.tasks)) {
      childrenToImport = itemData.tasks;
    }

    for (const childItemData of childrenToImport) {
      await importItemRecursive(childItemData, boardId, columnId, currentUserId, insertedItem.id, importErrors, incrementSuccessCount, incrementErrorCount);
    }

  } catch (error) {
    console.error(`Fehler beim Importieren von Item "${itemData.title || 'Unbenanntes Item'}":`, error);
    importErrors.push(`Fehler bei "${(itemData.title || 'Unbenanntes Item').substring(0,20)}...": ${error.message.substring(0,30)}...`);
    incrementErrorCount();
    // Optional: Den Fehler hier weiterwerfen, wenn ein einzelner Fehler den gesamten Import stoppen soll
    // throw error; 
  }
};

const ImportPage = () => {
  const { toast } = useToast();
  const { userId } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedJsonData, setParsedJsonData] = useState(null);
  const [parsingStatus, setParsingStatus] = useState(null); // null, 'success', 'error'
  const [parsingMessage, setParsingMessage] = useState('');
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [isImporting, setIsImporting] = useState(false); // NEUER STATE

  useEffect(() => {
    const fetchBoards = async () => {
      if (!userId) return;
      setLoadingBoards(true);
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('id, name')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) throw error;
        setBoards(data || []);
      } catch (error) {
        toast({
          title: 'Fehler beim Laden der Boards',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingBoards(false);
      }
    };
    fetchBoards();
  }, [userId, toast]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/json') {
        setSelectedFile(file);
        setFileName(file.name);
        setParsingStatus(null);
        setParsingMessage('');
        setParsedJsonData(null);
        parseJsonFile(file);
      } else {
        setSelectedFile(null);
        setFileName('');
        setParsingStatus('error');
        setParsingMessage('Ungültiger Dateityp. Bitte wählen Sie eine .json-Datei.');
        setParsedJsonData(null);
        toast({ title: 'Ungültiger Dateityp', description: 'Bitte wählen Sie eine .json-Datei.', variant: 'destructive'});
      }
    }
  };

  const parseJsonFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        setParsedJsonData(data);
        setParsingStatus('success');
        setParsingMessage(`JSON-Datei '${file.name}' erfolgreich geparst.`);
        toast({ title: 'Datei geparst', description: `JSON-Datei '${file.name}' erfolgreich geparst.` });
      } catch (error) {
        setParsedJsonData(null);
        setParsingStatus('error');
        setParsingMessage(`Fehler beim Parsen der JSON-Datei: ${error.message}. Bitte stellen Sie sicher, dass es eine valide JSON-Datei ist.`);
        toast({ title: 'Parsing Fehler', description: `Fehler beim Parsen: ${error.message}`, variant: 'destructive'});
      }
    };
    reader.onerror = () => {
        setParsedJsonData(null);
        setParsingStatus('error');
        setParsingMessage('Fehler beim Lesen der Datei.');
        toast({ title: 'Lesefehler', description: 'Datei konnte nicht gelesen werden.', variant: 'destructive'});
    };
    reader.readAsText(file);
  };

  const handleCopyStructure = () => {
    navigator.clipboard.writeText(expectedJsonStructure)
      .then(() => {
        toast({ title: 'Struktur kopiert', description: 'Die JSON-Beispielstruktur wurde in die Zwischenablage kopiert.' });
      })
      .catch(err => {
        toast({ title: 'Fehler beim Kopieren', description: 'Konnte Struktur nicht kopieren.', variant: 'destructive' });
        console.error('Fehler beim Kopieren der Struktur: ', err);
      });
  };

// Import-Handler Funktion
const handleImportStart = async () => {
    if (!parsedJsonData || !selectedBoardId || !userId || parsingStatus !== 'success') {
        toast({
            title: 'Fehlende oder ungültige Informationen',
            description: 'Bitte stellen Sie sicher, dass eine gültige Datei geparst und ein Ziel-Board ausgewählt wurde.',
            variant: 'destructive',
        });
        return;
    }

    if (!parsedJsonData.items || !Array.isArray(parsedJsonData.items) || parsedJsonData.items.length === 0) {
      toast({
        title: 'Keine Items gefunden',
        description: 'Die JSON-Datei enthält keine Items im erwarteten Format oder das "items"-Array ist leer.',
        variant: 'warning',
      });
      return;
    }
setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const importErrors = [];

    // Hilfsfunktionen, um die Zähler zu inkrementieren
    const incrementSuccess = () => successCount++;
    const incrementError = () => errorCount++;

    try {
      const { data: boardColumns, error: columnsError } = await supabase
        .from('columns')
        .select('id, name')
        .eq('board_id', selectedBoardId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (columnsError) throw columnsError;
      if (!boardColumns || boardColumns.length === 0) {
        toast({
          title: 'Keine Spalten im Ziel-Board',
          description: 'Das ausgewählte Board hat keine Spalten. Import nicht möglich.',
          variant: 'destructive',
        });
        setIsImporting(false);
        return;
      }
      const targetColumnId = boardColumns[0].id;
      console.log(`Importiere alle Items in Spalte ID: ${targetColumnId} (Name: ${boardColumns[0].name})`);

      for (const topLevelItem of parsedJsonData.items) {
        // Wir warten hier auf jedes Top-Level Item, um Fehler besser zu isolieren
        // und um sicherzustellen, dass parent IDs für die nächste Ebene verfügbar sind.
        await importItemRecursive(topLevelItem, selectedBoardId, targetColumnId, userId, null, importErrors, incrementSuccess, incrementError);
      }

      if (errorCount > 0) {
        toast({
          title: 'Import abgeschlossen mit Fehlern',
          description: `${successCount} Items importiert, ${errorCount} Fehler. Details: ${importErrors.slice(0, 3).join('; ')}`,
          variant: 'warning',
          duration: 9000,
        });
      } else {
        toast({
          title: 'Import erfolgreich!',
          description: `${successCount} Items wurden in das Board "${boards.find(b => b.id === selectedBoardId)?.name}" importiert.`,
        });
      }
    } catch (error) {
      console.error('Schwerwiegender Fehler während des Imports:', error);
      toast({
        title: 'Import fehlgeschlagen',
        description: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isImportDisabled = !parsedJsonData || !selectedBoardId || parsingStatus !== 'success' || isImporting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-3xl p-4 md:p-6"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple-pink mb-8">
        Aufgaben importieren
      </h1>

      <Card className="mb-8 bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-purple-300">1. JSON-Datei hochladen</CardTitle>
          <CardDescription className="text-slate-400">
            Wählen Sie eine .json-Datei mit Ihren Aufgaben aus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label
            htmlFor="json-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700/80 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-3 text-purple-400" />
              <p className="mb-2 text-sm text-slate-300">
                <span className="font-semibold">Klicken zum Hochladen</span> oder Datei hierher ziehen
              </p>
              <p className="text-xs text-slate-400">Nur JSON-Dateien (.json)</p>
            </div>
            <Input id="json-upload" type="file" className="hidden" accept=".json" onChange={handleFileChange} />
          </Label>
          {fileName && (
            <div className={`mt-4 p-3 rounded-md text-sm flex items-center ${
              parsingStatus === 'success' ? 'bg-green-500/20 text-green-300' : 
              parsingStatus === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {parsingStatus === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              {parsingStatus === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
              {parsingMessage || `Ausgewählte Datei: ${fileName}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-purple-300">2. Ziel-Board auswählen</CardTitle>
          <CardDescription className="text-slate-400">
            Wählen Sie das Board aus, in das die Aufgaben importiert werden sollen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBoards ? (
            <div className="flex items-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Lade Boards...
            </div>
          ) : (
            <Select value={selectedBoardId} onValueChange={setSelectedBoardId} disabled={boards.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={boards.length === 0 ? "Keine Boards gefunden" : "Wählen Sie ein Board"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Verfügbare Boards</SelectLabel>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
           {boards.length === 0 && !loadingBoards && (
            <p className="text-sm text-slate-500 mt-2">Sie haben noch keine Boards erstellt. Bitte erstellen Sie zuerst ein Board.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 bg-slate-800/70 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl text-purple-300">Erwartete JSON-Struktur</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900/70 p-4 rounded-md text-sm text-slate-300 overflow-x-auto custom-scrollbar">
            {expectedJsonStructure}
          </pre>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleCopyStructure} className="text-slate-300 border-slate-600 hover:bg-slate-700">
            <Copy size={16} className="mr-2" /> Struktur kopieren
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center">
        <Button
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600"
          onClick={handleImportStart}
          disabled={isImportDisabled}
        >
          {isImporting ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <UploadCloud size={20} className="mr-2" />
          )}
          {isImporting ? 'Importiere...' : 'Import starten'} 
        </Button>
      </div>
    </motion.div>
  );
};

export default ImportPage;
