{{- define "autopal.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "autopal.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "autopal.labels" -}}
app.kubernetes.io/name: {{ include "autopal.name" . }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end -}}

{{- define "autopal.selectorLabels" -}}
app.kubernetes.io/name: {{ include "autopal.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "autopal.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- if .Values.serviceAccount.name -}}
{{- .Values.serviceAccount.name -}}
{{- else -}}
{{ include "autopal.fullname" . }}
{{- end -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "autopal.breakGlassSecretName" -}}
{{- if .Values.breakGlassSecret.existingSecretName -}}
{{- .Values.breakGlassSecret.existingSecretName -}}
{{- else -}}
{{- if .Values.breakGlassSecret.name -}}
{{- .Values.breakGlassSecret.name -}}
{{- else -}}
{{ printf "%s-break-glass" (include "autopal.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}
{{- end -}}
