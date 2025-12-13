/**
 * API Key Configuration Component
 * Allows users to configure their Gemini API key
 */

import { useState } from 'react';
import { Key, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface APIKeyConfigProps {
  onSave: (key: string) => void;
  isConfigured: boolean;
}

export function APIKeyConfig({ onSave, isConfigured }: APIKeyConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(!isConfigured);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    if (!apiKey.startsWith('AI')) {
      setError('Invalid API key format. Gemini API keys typically start with "AI"');
      return;
    }

    onSave(apiKey.trim());
    setShowInput(false);
    setError(null);
    setApiKey('');
  };

  if (isConfigured && !showInput) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
        <Check className="h-4 w-4 text-success" />
        <span className="text-sm text-success">Gemini API configured</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => setShowInput(true)}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Key className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">Configure Gemini API</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your Google Gemini API key to enable AI features.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Enter your Gemini API key..."
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="text-sm"
        />

        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Get API key <ExternalLink className="h-3 w-3" />
        </a>
        <div className="flex gap-2">
          {isConfigured && (
            <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            Save Key
          </Button>
        </div>
      </div>
    </Card>
  );
}
