PROJECT_NAME=nest-api-starter
IMAGE=org/$(PROJECT_NAME)
AWS_DEFAULT_REGION 	:= ap-southeast-1
AWS_ECR_REPO 		:= $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_DEFAULT_REGION).amazonaws.com/$(IMAGE)

ifndef AWS_ACCOUNT_ID
	AWS_ACCOUNT_ID=99999
	AWS_ECR_REPO=$(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_DEFAULT_REGION).amazonaws.com/$(IMAGE)
endif

ifndef IMAGE_TAG
	IMAGE_TAG=$(shell git rev-parse --short=8 HEAD)
endif

ifndef CI_ENVIRONMENT_SLUG
	CI_ENVIRONMENT_SLUG=stg
endif

new-module:
	@[ "${name}" ] || ( echo "name is not set, eg: make new-module name=module"; exit 1 )
	nest g mo $(name)
	nest g co $(name)
	nest g s $(name)

start_db:
	docker-compose -f .dev/docker-compose.postgres.yaml up --remove-orphans -d

stop_db:
	docker-compose -f .dev/docker-compose.postgres.yaml down

compose: stop_db start_db

clean:
	rm -rf dist

clean_db:
	rm -rf .dev/postgres

dotenv:
	cp .env.example .env

bootstrap: dotenv
	npm i

docker-build: Dockerfile
	@echo $(AWS_ACCOUNT_ID)
	@echo $(AWS_ECR_REPO)
	@echo "+\n++ Performing build of Docker image $(IMAGE)...\n+"
	@docker build -t $(IMAGE):$(IMAGE_TAG) --force-rm --rm .

docker-push:
	@echo "+\n++ Logging in to Amazon ECR $(AWS_ACCOUNT_ID) ...\n+"
	@aws ecr get-login-password --region $(AWS_DEFAULT_REGION) | docker login --username AWS --password-stdin $(AWS_ECR_REPO)
	@echo "+\n++ Pushing image $(IMAGE):$(IMAGE_TAG) to AWS ECR...\n+"
	@docker tag $(IMAGE):$(IMAGE_TAG) $(AWS_ECR_REPO):$(IMAGE_TAG)
	@docker push $(AWS_ECR_REPO):$(IMAGE_TAG)

docker: docker-build docker-push

pbcopy-env:
	@tr "\n" "," < .env | pbcopy

migrate:
	npm run migration:generate init

start:
	npm run start:dev

print:
	echo "$(AWS_ECR_REPO):$(IMAGE_TAG) $(CI_ENVIRONMENT_SLUG)"