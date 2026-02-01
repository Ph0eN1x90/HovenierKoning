<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="width-600px">

      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6 primary-color">
          {{ isEditMode ? `Wijzig ${tree.treetype} boomnummer ${tree.treenumber}` : 'Nieuw Boom Toevoegen' }}
        </div>
        <q-btn class="flex-row-title-btn" size="sm" flat round icon="close" @click="onDialogCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <div class="text-subtitle1 primary-color">{{ address.streetname + ' ' + address.housenumber }}</div>
        <div class="text-subtitle1 primary-color">{{ address.zipcode + ' ' + address.city }}</div>
      </q-card-section>

      <q-card-section>
        <q-form ref="form" @submit.prevent="onSubmit" @reset="onReset" class="q-gutter-md">
          <q-input
          v-model="tree.treetype"
          name="boomtype"
          label="Boomtype"
          type="text"
          :rules="[v => !!v || 'Boomtype is verplicht']"
          lazy-rules
          :clearable="isEditMode"
          outlined
          dense
          required
          />
          <q-input
          v-model.number="tree.diameter"
          name="diameter"
          label="Diameter (cm)"
          type="number"
          :rules="[v => v >= 0 || 'Diameter moet positief zijn']"
          lazy-rules
          :clearable="isEditMode"
          outlined
          dense
          required
          />
          <q-input
          v-model.number="tree.height"
          name="hoogte"
          label="Hoogte (m)"
          type="number"
          :rules="[v => v >= 0 || 'Hoogte moet positief zijn']"
          lazy-rules
          :clearable="isEditMode"
          outlined
          dense
          required
          />

          <q-input
          v-model="tree.comment"
          name="comment"
          label="Commentaar"
          type="textarea"
          :rules="[v => v.length <= 500 || 'Commentaar mag maximaal 500 tekens zijn']"
          lazy-rules
          :clearable="isEditMode"
          maxlength="500"
          outlined
          dense
          />

          <div class="justify-between flex">
            <CameraOrGalleryBtnComponent @createdImage="createdImage" />

            <q-checkbox
            v-model="tree.finished"
            name="afgerond"
            label="Afgerond"
            type="checkbox"
            @update:model-value="val => { if (val) tree.date_finished = new Date().toISOString().slice(0, 10); else tree.date_finished = null }"
            dense
            />
          </div>

          <q-separator />

      <!-- Foto's weergave -->
      <q-field
        v-model="tree.treeimage"
        class="q-mt-md"
        label="Wijzig boom foto's:"
        stack-label
        filled
        :error="tree.treeimage.length > 6"
        :error-message="tree.treeimage.length > 6 ? 'Maximaal 6 foto\'s toegestaan' : ''"
      >
        <template v-slot:control>
          <div class="row items-center">
            <div class="image-container q-ma-md" v-if="tree.treeimage.length > 0">
                <div class="image-gallery" v-for="(img, index) in tree.treeimage" :key="index">
                  <q-img
                    :src="img.imageurl"
                    alt="Boom foto"
                    class="preview-image"
                    @click="openCarousel(index)"
                    style="cursor: pointer;"
                  />
                  <q-btn
                    round
                    dense
                    flat
                    icon="delete"
                    size="sm"
                    color="primary"
                    class="delete-btn"
                    @click.stop="removeImage(index)"
                  >
                    <q-tooltip>Verwijder foto</q-tooltip>
                  </q-btn>
                </div>
            </div>
          </div>
        </template>
      </q-field>

          <!-- Carousel Dialog -->
          <q-dialog v-model="showCarousel">
            <q-card class="width-600px">
              <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Foto's</div>
                <q-space />
                <q-btn icon="close" flat round dense @click="showCarousel = false" />
              </q-card-section>
              <q-card-section>
                <CarouselComponent :images="tree.treeimage.map(img => img.imageurl)" :initial-slide="selectedImageIndex" />
              </q-card-section>
            </q-card>
          </q-dialog>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn color="primary" label="Opslaan" @click="onSubmit" :disable="!canSave" />
        <q-btn flat label="Annuleren" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { api } from 'src/boot/axios';
  import { ref, watch, computed } from 'vue';
  import type { Address } from 'src/models/Address';
  import type { Tree } from 'src/models/Tree';
  import { useDialogPluginComponent } from 'quasar';
  import CameraOrGalleryBtnComponent from './CameraOrGalleryBtnComponent.vue';
  import CarouselComponent from './CarouselComponent.vue';

  const props = defineProps<{
    address: Address;
    tree?: Tree;
    lastTreeNumber?: number;
  }>();

  const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent();

  defineEmits([...useDialogPluginComponent.emits]);

  const form = ref();
  const valid = ref(false);
  const showCarousel = ref(false);
  const selectedImageIndex = ref(0);

  const isEditMode = computed(() => !!props.tree); // if tree prop is provided, we are in edit mode

  // Check if there are changes compared to original
  const hasChanges = computed(() => {
    if (!isEditMode.value) return true; // In create mode, always allow save

    const original = props.tree!;

    // Check if images have changed by comparing sorted URLs
    const currentImages = tree.value.treeimage.map(img => img.imageurl).sort();
    const originalImages = original.treeimage.map(img => img.imageurl).sort();

    const imagesChanged =
      currentImages.length !== originalImages.length ||
      currentImages.some((url, idx) => url !== originalImages[idx]);

    return (
      tree.value.treetype !== original.treetype ||
      tree.value.diameter !== original.diameter ||
      tree.value.height !== original.height ||
      tree.value.comment !== original.comment ||
      tree.value.finished !== original.finished ||
      imagesChanged
    );
  });

  // Combined validation: form is valid AND has changes (in edit mode)
  const canSave = computed(() => valid.value && hasChanges.value);

  // Initialize tree data
  const tree = ref<Tree>(
    props.tree
    ? { ...props.tree, treeimage: props.tree.treeimage ? [...props.tree.treeimage] : [] } // Edit mode: deep copy including images
    : { // Create mode: new tree
      id: null,
      treenumber: props.lastTreeNumber || 1,
      treetype: '',
      diameter: 0,
      height: 0,
      date_finished: null,
      finished: false,
      comment: '',
      address: props.address,
      treeimage: []
    }
    );

    watch(tree, () => {
      valid.value = !!tree.value.treetype &&
                    tree.value.diameter >= 0 &&
                    tree.value.height >= 0 &&
                    tree.value.comment.length <= 500 &&
                    tree.value.treeimage.length <= 6;

    }, { deep: true });

    const createdImage = (image: string) => {
      tree.value.treeimage.push({
        id: null,
        imageurl: image,
        tree: { id: tree.value.id }
      });
    };

    const removeImage = (index: number) => {
      tree.value.treeimage.splice(index, 1);
    };

    const openCarousel = (index: number) => {
      selectedImageIndex.value = index;
      showCarousel.value = true;
    };

    const onReset = () => {
      if (isEditMode.value) {
        tree.value = { ...props.tree!, treeimage: props.tree!.treeimage ? [...props.tree!.treeimage] : [] };
      } else {
        tree.value = {
          id: null,
          treenumber: props.lastTreeNumber || 1,
          treetype: '',
          diameter: 0,
          height: 0,
          date_finished: null,
          finished: false,
          comment: '',
          address: props.address,
          treeimage: []
        };
      }
    };

    const onSubmit = () => {
      form.value?.validate().then((isValid: boolean) => {
        if (!isValid) return;

        const apiCall = isEditMode.value
        ? api.put(`/api/trees/${tree.value.id}`, tree.value)
        : api.post('/api/trees/save', tree.value);

        apiCall
        .then(() => {
          onDialogCancel();
        })
        .catch((error) => {
          console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} tree:`, error);
        });
      });
    };
  </script>
