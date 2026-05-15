import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { lookupParent } from '../../api/entryExit.api';
import { getApiErrorMessage } from '../../api/httpClient';
import { getLocations } from '../../api/locations.api';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import type { Branch } from '../../models/branch';
import type { ChildProfile } from '../../models/child';
import pageOneArt from '../../public/page1.svg';
import { useAuthStore } from '../auth/auth.store';
import { useWalkInStore } from './walkIn.store';

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const childAvatar = (name: string) => name.trim().slice(0, 1).toUpperCase() || 'J';

const assignedBranchFromUser = (user: ReturnType<typeof useAuthStore.getState>['user']): Branch | undefined => {
  const nestedBranch = user?.location ?? user?.branch;
  const id = user?.location_id ?? user?.branch_id ?? nestedBranch?.id;
  if (!id) return undefined;

  return {
    id,
    name: user?.location_name ?? user?.branch_name ?? nestedBranch?.name ?? 'Assigned branch',
    address: nestedBranch?.address,
    city: nestedBranch?.city,
    is_active: nestedBranch?.is_active
  };
};

type ActiveTextField = { type: 'parent' } | { type: 'child'; index: number };
type KeyboardMode = 'none' | 'number' | 'text';

interface KioskTextInputProps {
  fieldId: string;
  label: string;
  value: string;
  placeholder?: string;
  active: boolean;
  onFocus: () => void;
}

function KioskTextInput({ fieldId, label, value, placeholder, active, onFocus }: KioskTextInputProps) {
  return (
    <label className={active ? 'field kiosk-text-field active' : 'field kiosk-text-field'} data-keyboard-field={fieldId}>
      <span>{label}</span>
      <input type="text" inputMode="none" readOnly value={value} placeholder={placeholder} onFocus={onFocus} onClick={onFocus} />
    </label>
  );
}

export function WalkInPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { location, phone, parent, selectedChildren, newChildNames, customerName, updateDraft } = useWalkInStore();
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('none');
  const [activeTextField, setActiveTextField] = useState<ActiveTextField | null>(null);
  const [lookedUpPhone, setLookedUpPhone] = useState(() => (parent && /^\d{10}$/.test(phone) ? phone : ''));
  const authUser = useAuthStore((state) => state.user);
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations });

  useEffect(() => {
    const assignedBranch = assignedBranchFromUser(authUser);
    const resolvedBranch = assignedBranch?.id
      ? locationsQuery.data?.find((branch) => branch.id === assignedBranch.id) ?? assignedBranch
      : locationsQuery.data?.[0];

    if (resolvedBranch && location?.id !== resolvedBranch.id) {
      updateDraft({ location: resolvedBranch, passes: [], passIds: [] });
    }
  }, [authUser, location?.id, locationsQuery.data, updateDraft]);

  const lookupMutation = useMutation({
    mutationFn: (mobile: string) => lookupParent(mobile),
    onSuccess: (data, mobile) => {
      const parentProfile = data.parent ?? null;
      const children = data.children ?? parentProfile?.children ?? [];
      const mergedParent = parentProfile ? { ...parentProfile, children, active_sessions: data.active_sessions ?? parentProfile.active_sessions } : null;
      setLookedUpPhone(mobile);
      updateDraft({
        phone: mobile,
        parent: mergedParent,
        selectedChildren: [],
        customerName: mergedParent?.name ?? '',
        newChildNames: children.length ? [''] : [''],
        passes: [],
        passIds: []
      });
    }
  });

  const setPhone = (value: string) => {
    const mobile = value.replace(/\D/g, '').slice(0, 10);
    const phoneChangedAfterLookup = lookedUpPhone && mobile !== lookedUpPhone;
    updateDraft({
      phone: mobile,
      passes: [],
      passIds: [],
      ...(phoneChangedAfterLookup || mobile.length < 10
        ? { parent: null, selectedChildren: [], customerName: '', newChildNames: [''] }
        : {})
    });
    if (phoneChangedAfterLookup || mobile.length < 10) {
      setLookedUpPhone('');
    }
    if (mobile.length === 10 && mobile !== phone) {
      setKeyboardMode('none');
      lookupMutation.mutate(mobile);
    }
  };

  const addDigit = (digit: string) => {
    setKeyboardMode('number');
    if (activeTextField) {
      setTextFieldValue(`${getTextFieldValue()}${digit}`);
      return;
    }
    inputRef.current?.focus();
    setPhone(`${phone}${digit}`);
  };

  const removeDigit = () => {
    setKeyboardMode('number');
    if (activeTextField) {
      removeTextKey();
      return;
    }
    inputRef.current?.focus();
    setPhone(phone.slice(0, -1));
  };

  const closeKeyboard = () => {
    setKeyboardMode('none');
    setActiveTextField(null);
    inputRef.current?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const children = parent?.children ?? [];
  const activeIds = new Set((parent?.active_sessions ?? []).map((session) => session.child_id).filter(Boolean));

  const toggleChild = (child: ChildProfile) => {
    const exists = selectedChildren.some((selected) => selected.id === child.id);
    updateDraft({
      selectedChildren: exists
        ? selectedChildren.filter((selected) => selected.id !== child.id)
        : [...selectedChildren, child],
      passes: [],
      passIds: []
    });
  };

  const updateChildName = (index: number, value: string) => {
    updateDraft({
      newChildNames: newChildNames.map((name, childIndex) => (childIndex === index ? value : name)),
      passes: [],
      passIds: []
    });
  };

  const getTextFieldValue = () => {
    if (!activeTextField) return '';
    if (activeTextField.type === 'parent') return customerName;
    return newChildNames[activeTextField.index] ?? '';
  };

  const setTextFieldValue = (value: string) => {
    if (!activeTextField) return;
    if (activeTextField.type === 'parent') {
      updateDraft({ customerName: value, passes: [], passIds: [] });
      return;
    }
    updateChildName(activeTextField.index, value);
  };

  const openTextKeyboard = (field: ActiveTextField) => {
    const fieldId = field.type === 'parent' ? 'parent' : `child-${field.index}`;
    setActiveTextField(field);
    setKeyboardMode('text');
    window.setTimeout(() => {
      document.querySelector(`[data-keyboard-field="${fieldId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
  };

  const addTextKey = (key: string) => {
    const current = getTextFieldValue();
    const nextKey = current.length === 0 || current.endsWith(' ') ? key : key.toLowerCase();
    setTextFieldValue(`${current}${nextKey}`);
  };

  const addSpace = () => {
    const current = getTextFieldValue();
    if (current && !current.endsWith(' ')) {
      setTextFieldValue(`${current} `);
    }
  };

  const removeTextKey = () => {
    setTextFieldValue(getTextFieldValue().slice(0, -1));
  };

  const hasNewChild = newChildNames.some((name) => name.trim());
  const lookupComplete = /^\d{10}$/.test(phone) && lookedUpPhone === phone && (lookupMutation.isSuccess || Boolean(parent));
  const canContinue =
    Boolean(location) &&
    /^\d{10}$/.test(phone) &&
    lookupComplete &&
    (selectedChildren.length > 0 || hasNewChild) &&
    (Boolean(parent) || customerName.trim().length > 1);

  return (
    <main className="kiosk-stage">
      <section className="kiosk-device walk-device">
        <div className={keyboardMode !== 'none' ? 'kiosk-scroll keyboard-open' : 'kiosk-scroll'}>
          <section className="walk-hero">
            <img className="walk-hero-art" src={pageOneArt} alt="JustWave Playzone" />
          </section>

          <section className="walk-sheet">
            <div className="kiosk-section-title">
              <span className="section-icon">#</span>
              <div>
                <h3>Enter mobile number</h3>
                <p>We'll find your account or create a new one</p>
              </div>
            </div>

            <label className="phone-box" htmlFor="walk-phone">
              <span>+91</span>
              <input
                ref={inputRef}
                id="walk-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                value={phone}
                onFocus={() => {
                  setActiveTextField(null);
                  setKeyboardMode('number');
                }}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>

            {lookupMutation.isPending ? <Toast>Looking up customer...</Toast> : null}
            {lookupMutation.isError ? <Toast tone="error">{getApiErrorMessage(lookupMutation.error)}</Toast> : null}
            {lookupComplete && !parent ? (
              <Toast>Add parent and child details for a new walk-in.</Toast>
            ) : null}

            {lookupComplete && parent ? (
              <section className="parent-profile-card">
                <span>Parent profile</span>
                <strong>{parent.name ?? 'Guest'}</strong>
                <small>+91 {parent.phone ?? phone}</small>
              </section>
            ) : null}

            {lookupComplete && !parent ? (
              <KioskTextInput
                fieldId="parent"
                label="Parent name"
                value={customerName}
                placeholder="Enter parent name"
                active={activeTextField?.type === 'parent'}
                onFocus={() => openTextKeyboard({ type: 'parent' })}
              />
            ) : null}

            {lookupComplete ? (
              <>
                <div className="divider" />

                <div className="kiosk-section-title">
                  <span className="section-icon people-icon">2</span>
                  <div>
                    <h3>{parent ? `${parent.name ?? 'Parent'}'s children` : 'Select children'}</h3>
                    <p>{parent ? 'Choose one or more existing children for the pass' : 'Add child details for this pass'}</p>
                  </div>
                </div>

                {children.length ? (
                  <div className="kid-list">
                    {children.map((child) => {
                      const disabled = activeIds.has(child.id) || Boolean(child.active_session);
                      const selected = selectedChildren.some((item) => item.id === child.id);
                      return (
                        <button
                          type="button"
                          key={child.id}
                          className={selected ? 'kid-card selected' : 'kid-card'}
                          disabled={disabled}
                          onClick={() => toggleChild(child)}
                        >
                          <span className="kid-avatar">{childAvatar(child.name)}</span>
                          <span>
                            <strong>{child.name}</strong>
                            <small>{disabled ? 'Already inside' : selected ? 'Selected' : 'Tap to select'}</small>
                          </span>
                          <b>{selected ? '✓' : '+'}</b>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="new-child-stack">
                  {(!parent || !children.length || hasNewChild) &&
                    newChildNames.map((name, index) => (
                      <KioskTextInput
                        key={index}
                        fieldId={`child-${index}`}
                        label={`New child ${index + 1}`}
                        value={name}
                        placeholder="Enter child name"
                        active={activeTextField?.type === 'child' && activeTextField.index === index}
                        onFocus={() => openTextKeyboard({ type: 'child', index })}
                      />
                    ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => updateDraft({ newChildNames: [...newChildNames, ''], passes: [], passIds: [] })}
                  >
                    Add New Child
                  </Button>
                </div>
              </>
            ) : null}

            <Button
              className="kiosk-primary"
              type="button"
              disabled={!canContinue}
              onClick={() => {
                setActiveTextField(null);
                setKeyboardMode('none');
                navigate('/walk-in/payment');
              }}
            >
              Continue
            </Button>
            <p className="kiosk-footnote">{location?.name ?? 'Branch assigned at login'}</p>
          </section>
        </div>
        <div className={keyboardMode !== 'none' ? 'keyboard-sheet open' : 'keyboard-sheet'} aria-label="Keyboard">
          <div className="keyboard-handle" />
          {keyboardMode === 'number' ? (
            <div className="number-pad">
              {digits.slice(0, 9).map((digit) => (
                <button type="button" key={digit} onClick={() => addDigit(digit)}>
                  {digit}
                </button>
              ))}
              {activeTextField ? (
                <button type="button" onClick={() => setKeyboardMode('text')}>
                  ABC
                </button>
              ) : null}
              <button type="button" onClick={() => addDigit('0')}>
                0
              </button>
              <button type="button" onClick={removeDigit}>
                Delete
              </button>
              <button type="button" onClick={closeKeyboard}>
                Done
              </button>
            </div>
          ) : (
            <div className="text-pad">
              {keyboardRows.map((row) => (
                <div className="text-pad-row" key={row.join('')}>
                  {row.map((key) => (
                    <button type="button" key={key} onClick={() => addTextKey(key)}>
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="text-pad-row controls">
                <button type="button" onClick={() => setKeyboardMode('number')}>
                  123
                </button>
                <button type="button" onClick={addSpace}>
                  Space
                </button>
                <button type="button" onClick={removeTextKey}>
                  Delete
                </button>
                <button type="button" onClick={closeKeyboard}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
