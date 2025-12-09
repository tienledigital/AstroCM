
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GithubRepo, IGitService, GithubUser, ServiceType, AppSettings, ProjectType } from '../types';
import PostList from './PostList';
import CreatePostWrapper from './CreatePostWrapper';
import ImageList from './ImageList';
import { SettingsIcon } from './icons/SettingsIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import BackupManager from './BackupManager';
import TemplateGenerator from './TemplateGenerator';
import { useI18n } from '../i18n/I18nContext';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { MenuIcon } from './icons/MenuIcon';
import DirectoryPicker from './DirectoryPicker';
import { DatabaseIcon } from './icons/DatabaseIcon'; // New
import { BoardIcon } from './icons/BoardIcon'; // New
import { TemplateIcon } from './icons/TemplateIcon';
import { ClockIcon } from './icons/ClockIcon';
import { Sidebar } from './Sidebar';
import { SetupWizard } from './SetupWizard';
import { SettingsView } from './SettingsView';
import { SyncStatusBadge } from './SyncStatusBadge';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

// --- MAIN DASHBOARD ---
interface DashboardProps {
  gitService: IGitService;
  repo: GithubRepo;
  user: GithubUser;
  serviceType: ServiceType;
  onLogout: () => void;
  onResetAndLogout: () => void;
}

const SETTINGS_SCHEMA: { [key: string]: (v: any) => boolean } = {
    projectType: (v) => ['astro', 'github'].includes(v),
    postsPath: (v) => typeof v === 'string' && v.trim().length > 0 && !v.includes('..'),
    imagesPath: (v) => typeof v === 'string' && v.trim().length > 0 && !v.includes('..'),
    domainUrl: (v) => typeof v === 'string',
    postTemplate: (v) => typeof v === 'string',
    postFileTypes: (v) => typeof v === 'string' && v.length < 100,
    imageFileTypes: (v) => typeof v === 'string' && v.length < 100,
    publishDateSource: (v) => ['file', 'system'].includes(v),
    imageCompressionEnabled: (v) => typeof v === 'boolean',
    maxImageSize: (v) => typeof v === 'number' && v >= 10 && v <= 1024, // Min 10KB, Max 1024 KB (1MB)
    imageResizeMaxWidth: (v) => typeof v === 'number' && v >= 0 && v <= 10000,
    newPostCommit: (v) => typeof v === 'string' && v.length < 200,
    updatePostCommit: (v) => typeof v === 'string' && v.length < 200,
    newImageCommit: (v) => typeof v === 'string' && v.length < 200,
    updateImageCommit: (v) => typeof v === 'string' && v.length < 200,
    'astro-content-manager-lang': (v) => ['en', 'vi'].includes(v),
};

const Dashboard: React.FC<DashboardProps> = ({ gitService, repo, user, serviceType, onLogout, onResetAndLogout }) => {
  const [settings, setSettings] = useState<AppSettings>({
    projectType: 'astro',
    postsPath: '',
    imagesPath: 'public/images',
    domainUrl: '',
    postFileTypes: '.md,.mdx',
    imageFileTypes: 'image/*',
    publishDateSource: 'file',
    imageCompressionEnabled: false,
    maxImageSize: 500, // Default 500KB
    imageResizeMaxWidth: 1024, // Default 1024px
    newPostCommit: 'feat(content): add post "{filename}"',
    updatePostCommit: 'fix(content): update post "{filename}"',
    newImageCommit: 'feat(assets): add image "{filename}"',
    updateImageCommit: 'refactor(assets): update image for "{filename}"',
  });
  
  // Initialize activeView from URL search params
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        const validViews = ['dashboard', 'workflows', 'images', 'template', 'backup', 'settings'];
        return view && validViews.includes(view) ? view : 'dashboard';
    }
    return 'dashboard';
  });

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState<'posts' | 'images' | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importExportStatus, setImportExportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [repoStats, setRepoStats] = useState<{postCount: number | null, imageCount: number | null}>({ postCount: null, imageCount: null });
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('scanning');

  const [suggestedPostPaths, setSuggestedPostPaths] = useState<string[]>([]);
  const [suggestedImagePaths, setSuggestedImagePaths] = useState<string[]>([]);
  const { t, language } = useI18n();

  // Sync Logic
  const [currentRepo, setCurrentRepo] = useState<GithubRepo>(repo);
  const [lastWriteTime, setLastWriteTime] = useState<number | null>(null);
  const [isSynced, setIsSynced] = useState(true);

  // Sync state to URL
  useEffect(() => {
    if (window.location.protocol === 'blob:') return;

    try {
        const url = new URL(window.location.href);
        const currentViewInUrl = url.searchParams.get('view');
        
        if (currentViewInUrl !== activeView) {
            url.searchParams.set('view', activeView);
            if (!currentViewInUrl) {
                window.history.replaceState({}, '', url.toString());
            } else {
                window.history.pushState({}, '', url.toString());
            }
        }
    } catch (e) {
        console.warn("URL Sync disabled due to environment restrictions.");
    }
  }, [activeView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        if (view) {
            setActiveView(view);
        } else {
            setActiveView('dashboard');
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchStats = useCallback(async () => {
    setRepoStats({ postCount: null, imageCount: null });
    if (!gitService) return;
    try {
        const postContents = await gitService.getRepoContents(settings.postsPath);
        const postCount = postContents.filter(item => item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))).length;
        
        let imageCount = 0;
        try {
            const imageContents = await gitService.getRepoContents(settings.imagesPath);
            imageCount = imageContents.filter(item => item.type === 'file').length;
        } catch { imageCount = 0; }

        setRepoStats({ postCount, imageCount });
    } catch { setRepoStats({ postCount: 0, imageCount: 0}); }
  }, [gitService, settings.postsPath, settings.imagesPath]);

  // Sync Polling Logic
  const handleAction = useCallback(() => {
      setLastWriteTime(Date.now());
      setIsSynced(false);
  }, []);

  useEffect(() => {
      if (!lastWriteTime) return;

      const checkSync = async () => {
          try {
              const updatedRepo = await gitService.getRepoDetails();
              setCurrentRepo(updatedRepo);
              
              const pushedTime = new Date(updatedRepo.pushed_at).getTime();
              
              // allow a 10s buffer
              if (pushedTime >= (lastWriteTime - 10000)) {
                  setIsSynced(true);
                  setLastWriteTime(null); // Stop polling
              }
          } catch (e) {
              console.error("Sync check failed", e);
          }
      };

      // Check immediately
      checkSync();

      const interval = setInterval(checkSync, 3000);
      return () => clearInterval(interval);
  }, [lastWriteTime, gitService]);


  useEffect(() => {
    const loadSettingsAndScan = async () => {
      setIsScanning(true);
      setScanStatusMessage('scanning');
      const projectTypeKey = `projectType_${repo.full_name}`;
      const postsPathKey = `postsPath_${repo.full_name}`;
      const imagesPathKey = `imagesPath_${repo.full_name}`;
      
      const savedProjectType = localStorage.getItem(projectTypeKey) as ProjectType | null;
      const savedPostsPath = localStorage.getItem(postsPathKey);
      const savedImagesPath = localStorage.getItem(imagesPathKey);

      // Attempt to load settings from local storage
      const loadedSettings: Partial<AppSettings> = {};
      const keys: (keyof AppSettings)[] = [
        'projectType', 'postsPath', 'imagesPath', 'domainUrl', 'postFileTypes', 'imageFileTypes',
        'publishDateSource', 'imageCompressionEnabled', 'maxImageSize', 'imageResizeMaxWidth',
        'newPostCommit', 'updatePostCommit', 'newImageCommit', 'updateImageCommit'
      ];

       keys.forEach(key => {
        let storageKey = ['projectType', 'postsPath', 'imagesPath', 'domainUrl'].includes(key)
          ? `${key}_${repo.full_name}`
          : key;
        const value = localStorage.getItem(storageKey);
        if (value !== null) {
          if (key === 'imageCompressionEnabled') {
              (loadedSettings as any)[key] = value === 'true';
          } else if (key === 'maxImageSize') {
              let val = Number(value);
              if (val < 10) val = 500;
              if (val > 1024) val = 1024;
              (loadedSettings as any)[key] = val;
          } else if (key === 'imageResizeMaxWidth') {
              (loadedSettings as any)[key] = Number(value);
          } else {
              (loadedSettings as any)[key] = value;
          }
        }
      });
      if (loadedSettings.imageResizeMaxWidth === undefined) {
          loadedSettings.imageResizeMaxWidth = 1024;
      }

      setSettings(prev => ({ ...prev, ...loadedSettings }));

      if (savedProjectType && savedPostsPath && savedImagesPath) {
        setIsSetupComplete(true);
        setIsScanning(false);
      } else {
        try {
           const configContent = await gitService.getFileContent('.acmrc.json');
           const config = JSON.parse(configContent);
           
           if (config) {
               const newSettings = { ...settings };
               
               const applyIfValid = (key: keyof AppSettings, value: any) => {
                   if (value !== undefined && SETTINGS_SCHEMA[key] && SETTINGS_SCHEMA[key](value)) {
                       (newSettings as any)[key] = value;
                   }
               };

               if (config.projectType) applyIfValid('projectType', config.projectType);
               if (config.paths?.posts) applyIfValid('postsPath', config.paths.posts);
               if (config.paths?.images) applyIfValid('imagesPath', config.paths.images);
               if (config.domainUrl) applyIfValid('domainUrl', config.domainUrl);
               
               if (config.settings) {
                   applyIfValid('postFileTypes', config.settings.postFileTypes);
                   applyIfValid('imageFileTypes', config.settings.imageFileTypes);
                   applyIfValid('publishDateSource', config.settings.publishDateSource);
                   applyIfValid('imageCompressionEnabled', config.settings.imageCompressionEnabled);
                   applyIfValid('maxImageSize', config.settings.maxImageSize);
                   applyIfValid('imageResizeMaxWidth', config.settings.imageResizeMaxWidth);
               }
               
               if (config.commits) {
                   applyIfValid('newPostCommit', config.commits.newPost);
                   applyIfValid('updatePostCommit', config.commits.updatePost);
                   applyIfValid('newImageCommit', config.commits.newImage);
                   applyIfValid('updateImageCommit', config.commits.updateImage);
               }

               setSettings(newSettings);
               
               const prefix = repo.full_name;
               localStorage.setItem(`projectType_${prefix}`, newSettings.projectType);
               localStorage.setItem(`postsPath_${prefix}`, newSettings.postsPath);
               localStorage.setItem(`imagesPath_${prefix}`, newSettings.imagesPath);
               if (newSettings.domainUrl) localStorage.setItem(`domainUrl_${prefix}`, newSettings.domainUrl);
               
               if (config.templates?.frontmatter) {
                   localStorage.setItem(`postTemplate_${prefix}`, JSON.stringify(config.templates.frontmatter));
               }
               if (config.ui?.tableColumns) {
                   localStorage.setItem(`postTableColumns_${prefix}`, JSON.stringify(config.ui.tableColumns));
               }
               if (config.ui?.columnWidths) {
                   localStorage.setItem(`postTableColumnWidths_${prefix}`, JSON.stringify(config.ui.columnWidths));
               }

               setIsSetupComplete(true);
               setIsScanning(false);
               return; 
           }
        } catch (e) {
           console.log("No valid .acmrc.json found or failed to parse, proceeding to scan.");
        }

        const [foundUrl, contentDirs, imageDirs] = await Promise.all([
            gitService.findProductionUrl(),
            gitService.scanForContentDirectories(),
            gitService.scanForImageDirectories(),
        ]);
        
        if (foundUrl) {
          setSettings(prev => ({ ...prev, domainUrl: foundUrl }));
        }
        setSuggestedPostPaths(contentDirs);
        if (contentDirs.length > 0) {
            setSettings(prev => ({...prev, postsPath: contentDirs[0]}));
        }
        setSuggestedImagePaths(imageDirs);
        if (imageDirs.length > 0) {
            setSettings(prev => ({...prev, imagesPath: imageDirs[0]}));
        }
        setIsScanning(false);
      }
    };

    loadSettingsAndScan();
  }, [repo.full_name, gitService]);
  
  useEffect(() => {
    if (isSetupComplete) {
        fetchStats();
    }
  }, [isSetupComplete, fetchStats]);

  const handleSettingsChange = (field: keyof AppSettings, value: string | number | boolean) => {
    setSettings(prev => ({...prev, [field]: value}));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
        const keys: (keyof AppSettings)[] = Object.keys(settings) as (keyof AppSettings)[];
        keys.forEach(key => {
            let storageKey = ['projectType', 'postsPath', 'imagesPath', 'domainUrl'].includes(key)
            ? `${key}_${repo.full_name}`
            : key;
            localStorage.setItem(storageKey, String(settings[key]));
        });

        try {
            const sha = await (gitService as any).getFileSha('.acmrc.json');
            if (sha) {
                const templateKey = `postTemplate_${repo.full_name}`;
                const columnsKey = `postTableColumns_${repo.full_name}`;
                const widthsKey = `postTableColumnWidths_${repo.full_name}`;
                const savedTemplate = localStorage.getItem(templateKey);
                const savedColumns = localStorage.getItem(columnsKey);
                const savedWidths = localStorage.getItem(widthsKey);

                const configObject = {
                    version: 1,
                    projectType: settings.projectType,
                    paths: {
                        posts: settings.postsPath,
                        images: settings.imagesPath
                    },
                    domainUrl: settings.domainUrl,
                    templates: {
                        frontmatter: savedTemplate ? JSON.parse(savedTemplate) : undefined
                    },
                    ui: {
                        tableColumns: savedColumns ? JSON.parse(savedColumns) : undefined,
                        columnWidths: savedWidths ? JSON.parse(savedWidths) : undefined
                    },
                    settings: {
                        postFileTypes: settings.postFileTypes,
                        imageFileTypes: settings.imageFileTypes,
                        publishDateSource: settings.publishDateSource,
                        imageCompressionEnabled: settings.imageCompressionEnabled,
                        maxImageSize: settings.maxImageSize,
                        imageResizeMaxWidth: settings.imageResizeMaxWidth
                    },
                    commits: {
                        newPost: settings.newPostCommit,
                        updatePost: settings.updatePostCommit,
                        newImage: settings.newImageCommit,
                        updateImage: settings.updateImageCommit
                    }
                };
                await gitService.updateFileContent('.acmrc.json', JSON.stringify(configObject, null, 2), 'chore: update astro-content-manager config', sha);
                handleAction(); // Trigger sync
            }
        } catch (e) {
            console.warn("Could not update .acmrc.json", e);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
        console.error("Failed to save settings:", e);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleExportSettings = () => {
    const repoSpecificKeysBase = ['projectType', 'postsPath', 'imagesPath', 'domainUrl', 'postTemplate'];
    const globalKeys = [
      'postFileTypes', 'imageFileTypes', 'publishDateSource', 'imageCompressionEnabled',
      'maxImageSize', 'imageResizeMaxWidth', 'newPostCommit', 'updatePostCommit',
      'newImageCommit', 'updateImageCommit', 'astro-content-manager-lang'
    ];
    
    const settingsToExport: { [key: string]: any } = {};

    globalKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            if (key === 'imageCompressionEnabled') settingsToExport[key] = value === 'true';
            else if (['maxImageSize', 'imageResizeMaxWidth'].includes(key)) settingsToExport[key] = Number(value);
            else settingsToExport[key] = value;
        }
    });

    repoSpecificKeysBase.forEach(key => {
        const storageKey = `${key}_${repo.full_name}`;
        const value = localStorage.getItem(storageKey);
        if (value !== null) settingsToExport[key] = value;
    });

    const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.download = `astro-content-manager-settings-${repo.name}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleImportClick = () => {
    setImportExportStatus(null);
    importFileInputRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
          const content = e.target?.result as string;
          const importedSettings = JSON.parse(content);
          
          for (const key in importedSettings) {
              if (!Object.prototype.hasOwnProperty.call(SETTINGS_SCHEMA, key)) {
                   console.warn(`Ignoring unrecognized setting key: ${key}`);
                   continue;
              }
              const validator = SETTINGS_SCHEMA[key];
              const value = importedSettings[key];
              
              if (!validator(value)) {
                  throw new Error(`Invalid value for setting '${key}'.`);
              }
          }

          const repoSpecificKeysBase = ['projectType', 'postsPath', 'imagesPath', 'domainUrl', 'postTemplate'];
          Object.entries(importedSettings).forEach(([key, value]) => {
              if (!SETTINGS_SCHEMA[key]) return; 

              let storageKey = key;
              if (repoSpecificKeysBase.includes(key)) {
                  storageKey = `${key}_${repo.full_name}`;
              }
              localStorage.setItem(storageKey, String(value));
          });

          setImportExportStatus({ type: 'success', message: t('dashboard.settings.importExport.importSuccess') });
          setTimeout(() => window.location.reload(), 2000);

      } catch (err) {
          let message = t('dashboard.settings.importExport.importError.validation');
          if (err instanceof SyntaxError) message = t('dashboard.settings.importExport.importError.json');
          setImportExportStatus({ type: 'error', message });
      } finally {
          if (event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
        setImportExportStatus({ type: 'error', message: t('dashboard.settings.importExport.importError.read') });
        if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleFinishSetup = async () => {
    const isReady = settings.projectType === 'github'
      ? !!settings.postsPath && !!settings.imagesPath
      : !!settings.postsPath && !!settings.imagesPath && !!settings.domainUrl;

    if (isReady) {
      handleSaveSettings();
      
      const prefix = repo.full_name;
      const savedTemplate = localStorage.getItem(`postTemplate_${prefix}`);
      const savedColumns = localStorage.getItem(`postTableColumns_${prefix}`);
      const savedWidths = localStorage.getItem(`postTableColumnWidths_${prefix}`);

      try {
          const configObject = {
            version: 1,
            projectType: settings.projectType,
            paths: {
                posts: settings.postsPath,
                images: settings.imagesPath
            },
            domainUrl: settings.domainUrl,
            settings: {
                postFileTypes: settings.postFileTypes,
                imageFileTypes: settings.imageFileTypes,
                publishDateSource: settings.publishDateSource,
                imageCompressionEnabled: settings.imageCompressionEnabled,
                maxImageSize: settings.maxImageSize,
                imageResizeMaxWidth: settings.imageResizeMaxWidth
            },
            commits: {
                newPost: settings.newPostCommit,
                updatePost: settings.updatePostCommit,
                newImage: settings.newImageCommit,
                updateImage: settings.updateImageCommit
            },
            templates: {
                frontmatter: savedTemplate ? JSON.parse(savedTemplate) : undefined
            },
            ui: {
                tableColumns: savedColumns ? JSON.parse(savedColumns) : undefined,
                columnWidths: savedWidths ? JSON.parse(savedWidths) : undefined
            }
          };
          
          await gitService.createFileFromString(
              '.acmrc.json', 
              JSON.stringify(configObject, null, 2), 
              'chore: add astro-content-manager config'
          );
          handleAction();
      } catch (e) {
          console.warn("Failed to create .acmrc.json or it already exists", e);
      }

      setIsSetupComplete(true);
    }
  }

  const handleDeleteConfig = async () => {
      // Remove native confirm so that we can use the ConfirmationModal in SettingsView
      
      setIsSaving(true);
      try {
          // 1. Delete .acmrc.json from repo
          const sha = await (gitService as any).getFileSha('.acmrc.json');
          if (sha) {
              await gitService.deleteFile('.acmrc.json', sha, 'chore: delete astro-content-manager config');
          }

          // 2. Clear local storage for this repo
          const prefix = repo.full_name;
          const repoSpecificKeys = [
            `projectType_${prefix}`, `postsPath_${prefix}`, `imagesPath_${prefix}`,
            `domainUrl_${prefix}`, `postTemplate_${prefix}`, 
            `postTableColumns_${prefix}`, `postTableColumnWidths_${prefix}`
          ];
          
          repoSpecificKeys.forEach(key => localStorage.removeItem(key));

          // 3. Clear session storage to force logout and return to login page
          sessionStorage.removeItem('github_pat_encrypted');
          sessionStorage.removeItem('crypto_key');
          sessionStorage.removeItem('selected_repo');
          sessionStorage.removeItem('service_type');
          sessionStorage.removeItem('instance_url');

          // 4. Reload page to trigger clean state
          window.location.reload();

      } catch (e) {
          console.error("Failed to delete config:", e);
          alert("Failed to delete .acmrc.json. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  const navLinks = [
    { id: 'dashboard', label: t('dashboard.nav.manage'), icon: DatabaseIcon }, // Replaced with DatabaseIcon
    { id: 'images', label: t('dashboard.nav.manageImages'), icon: ImageIcon },
    { id: 'template', label: t('dashboard.nav.template'), icon: TemplateIcon },
    { id: 'workflows', label: t('dashboard.nav.workflows'), icon: BoardIcon }, // Replaced with BoardIcon
    { id: 'backup', label: t('dashboard.nav.backup'), icon: DownloadIcon },
    { id: 'settings', label: t('dashboard.nav.settings'), icon: SettingsIcon },
  ];

  const handleMobileNavClick = (view: string) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };
  
  if (isScanning) {
    return (
        <div className="flex justify-center items-center h-screen flex-col bg-white">
            <SpinnerIcon className="animate-spin h-8 w-8 text-notion-text mb-4" />
            <p className="text-notion-muted">{t('dashboard.setup.scanning')}</p>
        </div>
    );
  }

  if (!isSetupComplete) {
    return (
        <SetupWizard 
            gitService={gitService}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            suggestedPostPaths={suggestedPostPaths}
            suggestedImagePaths={suggestedImagePaths}
            onFinish={handleFinishSetup}
        />
    );
  }

  const getPageIcon = () => {
      switch(activeView) {
          case 'dashboard': return <DatabaseIcon className="w-8 h-8 text-notion-text mr-3" />;
          case 'images': return <ImageIcon className="w-8 h-8 text-notion-text mr-3" />;
          case 'template': return <TemplateIcon className="w-8 h-8 text-notion-text mr-3" />;
          case 'workflows': return <BoardIcon className="w-8 h-8 text-notion-text mr-3" />;
          case 'backup': return <DownloadIcon className="w-8 h-8 text-notion-text mr-3" />;
          case 'settings': return <SettingsIcon className="w-8 h-8 text-notion-text mr-3" />;
          default: return <DocumentIcon className="w-8 h-8 text-notion-text mr-3" />;
      }
  }

  const getPageTitle = () => {
        switch(activeView) {
          case 'dashboard': return t('dashboard.header.title');
          case 'images': return t('dashboard.nav.manageImages');
          case 'template': return t('dashboard.nav.template');
          case 'workflows': return t('dashboard.nav.workflows');
          case 'backup': return t('dashboard.nav.backup');
          case 'settings': return t('dashboard.nav.settings');
          default: return '';
      }
  }

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
            <PostList 
                gitService={gitService} 
                repo={currentRepo} 
                path={settings.postsPath} 
                imagesPath={settings.imagesPath} 
                domainUrl={settings.domainUrl} 
                projectType={settings.projectType} 
                onPostUpdate={fetchStats} 
                postFileTypes={settings.postFileTypes} 
                imageFileTypes={settings.imageFileTypes} 
                newImageCommitTemplate={settings.newImageCommit} 
                updatePostCommitTemplate={settings.updatePostCommit} 
                imageCompressionEnabled={settings.imageCompressionEnabled} 
                maxImageSize={settings.maxImageSize} 
                imageResizeMaxWidth={settings.imageResizeMaxWidth}
                onAction={handleAction}
            />
        );
      case 'workflows': 
        return (
            <CreatePostWrapper 
                gitService={gitService} 
                repo={currentRepo} 
                settings={settings} 
                onComplete={() => {
                    setActiveView('dashboard');
                }} 
                onAction={handleAction}
            />
        );
      case 'images': return (
        <ImageList 
            gitService={gitService} 
            repo={currentRepo} 
            path={settings.imagesPath} 
            imageFileTypes={settings.imageFileTypes} 
            domainUrl={settings.domainUrl} 
            projectType={settings.projectType} 
            repoStats={repoStats} 
            imageCompressionEnabled={settings.imageCompressionEnabled} 
            maxImageSize={settings.maxImageSize} 
            imageResizeMaxWidth={settings.imageResizeMaxWidth}
            commitTemplate={settings.newImageCommit}
            onAction={handleAction}
        />
      );
      case 'template': return <TemplateGenerator gitService={gitService} repo={currentRepo} postsPath={settings.postsPath} />;
      case 'backup': return <BackupManager gitService={gitService} repo={currentRepo} postsPath={settings.postsPath} imagesPath={settings.imagesPath} />;
      case 'settings': return (
        <SettingsView
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSaveSettings}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            user={user}
            repo={currentRepo}
            onLogout={onLogout}
            onDeleteConfig={handleDeleteConfig}
            onExport={handleExportSettings}
            onImportClick={handleImportClick}
            fileInputRef={importFileInputRef}
            onFileImport={handleFileImport}
            importStatus={importExportStatus}
            onOpenPicker={(type) => setIsPickerOpen(type)}
        />
      );
      default: return null;
    }
  };

  const lastUpdated = currentRepo.pushed_at 
    ? new Date(currentRepo.pushed_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') 
    : '...';

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-notion-text">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-30 w-60 transform bg-notion-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <Sidebar 
                activeView={activeView} 
                onNavClick={handleMobileNavClick} 
                navLinks={navLinks} 
                user={user} 
                serviceType={serviceType} 
                onLogout={onLogout}
                onResetAndLogout={() => {}} // No-op, removed from sidebar but kept in type definition for now to avoid breaking changes if reused elsewhere, though prop removal is better
                isSynced={isSynced}
                repoStats={repoStats}
                lastUpdated={lastUpdated}
             />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white">
            {/* Sync Warning Banner */}
            {!isSynced && (
                <div className="bg-white border-b border-notion-border px-4 py-2 flex items-center justify-center sticky top-0 z-40 shadow-sm animate-fade-in text-xs">
                    <div className="flex items-center text-yellow-600">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-2" />
                        <span className="font-medium">{t('dashboard.syncWarning.description')}</span>
                    </div>
                </div>
            )}

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between bg-white border-b border-notion-border p-4">
                <div className="flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 rounded-sm text-gray-500 hover:bg-gray-100 focus:outline-none">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <span className="ml-3 text-lg font-bold text-gray-800">Content Manager</span>
                </div>
                <div className="flex items-center">
                     <SyncStatusBadge isSynced={isSynced} />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto bg-white">
                <div className="w-full max-w-full px-6 py-8 sm:px-8 lg:px-12 mx-auto">
                    {/* Notion-style Page Header */}
                    <div className="mb-8 group">
                        <div className="flex items-center mb-6">
                            {getPageIcon()}
                            <h1 className="text-4xl font-bold text-notion-text tracking-tight">{getPageTitle()}</h1>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </main>
        </div>

        {isPickerOpen && (
            <DirectoryPicker 
                gitService={gitService} 
                repo={repo} 
                onClose={() => setIsPickerOpen(null)} 
                onSelect={(path) => {
                    handleSettingsChange(isPickerOpen === 'posts' ? 'postsPath' : 'imagesPath', path);
                    setIsPickerOpen(null);
                }}
                initialPath={isPickerOpen === 'posts' ? settings.postsPath : settings.imagesPath}
            />
        )}
    </div>
  );
};

export default Dashboard;
