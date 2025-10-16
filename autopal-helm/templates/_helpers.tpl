{{- define "autopal.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "autopal.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "autopal.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" -}}
{{- end -}}

{{- define "autopal.labels" -}}
helm.sh/chart: {{ include "autopal.chart" . }}
{{ include "autopal.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "autopal.selectorLabels" -}}
app.kubernetes.io/name: {{ include "autopal.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "autopal.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{ default (include "autopal.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "autopal.breakGlassSecretName" -}}
{{- if .Values.secrets.breakGlass.secretName -}}
{{- .Values.secrets.breakGlass.secretName -}}
{{- else -}}
{{- printf "%s-break-glass" (include "autopal.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
